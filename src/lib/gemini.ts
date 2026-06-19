import { env } from '../config/env';

/**
 * Minimal Google Gemini client (REST, no SDK). The API key lives only in the
 * server env and is sent as the `X-goog-api-key` header — it is never exposed
 * to the browser.
 *
 * Resilience: the configured model is tried first; on transient errors
 * (429 / 5xx, e.g. the "high demand" 503 the `*-latest` aliases sometimes
 * return) it retries with backoff, then falls back to stable models.
 */

const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Models tried in order. The configured model leads; the rest are stable
// fallbacks so a single overloaded alias doesn't take the chatbot down.
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface GeminiTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GenerateOptions {
  systemInstruction: string;
  contents: GeminiTurn[];
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

async function callModel(
  model: string,
  body: string,
): Promise<{ ok: boolean; status: number; json?: GeminiResponse; detail?: string }> {
  const res = await fetch(ENDPOINT(model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': env.GEMINI_API_KEY,
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return { ok: false, status: res.status, detail };
  }
  return { ok: true, status: res.status, json: (await res.json()) as GeminiResponse };
}

const extractText = (json?: GeminiResponse): string =>
  json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';

export async function generateContent(opts: GenerateOptions): Promise<string> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: opts.systemInstruction }] },
    contents: opts.contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 800,
    },
  });

  // De-duplicate the model list (configured model first).
  const models = [env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(
    (m, i, arr) => arr.indexOf(m) === i,
  );

  let lastDetail = '';
  for (const model of models) {
    // Up to 3 attempts per model for transient 429/5xx.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await callModel(model, body);
        if (result.ok) {
          const text = extractText(result.json);
          if (text) return text;
          // Empty candidate (safety block / token budget) — try the next model.
          break;
        }
        lastDetail = `model=${model} status=${result.status} ${(result.detail ?? '').slice(0, 200)}`;
        // Retry only transient errors; otherwise move on to the next model.
        if (result.status === 429 || result.status >= 500) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        break;
      } catch (err) {
        lastDetail = `model=${model} network ${(err as Error).message}`;
        await sleep(400 * (attempt + 1));
      }
    }
  }

  console.error(`Gemini request failed after retries/fallbacks: ${lastDetail}`);
  throw new Error('GEMINI_REQUEST_FAILED');
}
