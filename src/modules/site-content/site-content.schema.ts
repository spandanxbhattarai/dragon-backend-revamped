import { z } from 'zod';

// ---------------------------------------------------------------------------
// Per-section content shapes. Each key maps to a zod schema that validates the
// JSON `data` blob stored for that section. Headings that render on multiple
// lines store their line breaks as "\n" and the frontend splits on them.
// ---------------------------------------------------------------------------

const homeHeroSchema = z.object({
  badge: z.string(),
  headingPrefix: z.string(),
  headingHighlight: z.string(),
  headingSuffix: z.string(),
  paragraph: z.string(),
  stats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .min(1)
    .max(3),
});

const homeStatsSchema = z.object({
  stats: z
    .array(
      z.object({
        end: z.coerce.number().int(),
        suffix: z.string(),
        label: z.string(),
      }),
    )
    .min(1)
    .max(4),
});

const homeAdvisorSchema = z.object({
  eyebrow: z.string(),
  heading: z.string(),
  imageUrl: z.string(),
  imageAlt: z.string(),
  name: z.string(),
  title: z.string(),
  quotes: z.array(z.string()).min(1),
});

const aboutHeroSchema = z.object({
  eyebrow: z.string(),
  heading: z.string(),
  paragraph: z.string(),
});

const aboutMissionSchema = z.object({
  eyebrow: z.string(),
  heading: z.string(),
  bodyParagraphs: z.array(z.string()).min(1),
  missionLabel: z.string(),
  missionText: z.string(),
  visionLabel: z.string(),
  visionText: z.string(),
});

const aboutStatsSchema = z.object({
  stats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .min(1)
    .max(4),
});

const aboutFaqSchema = z.object({
  eyebrow: z.string(),
  heading: z.string(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
});

// Registry of every editable section keyed by its stable string id.
export const sectionSchemas = {
  'home.hero': homeHeroSchema,
  'home.stats': homeStatsSchema,
  'home.advisor': homeAdvisorSchema,
  'about.hero': aboutHeroSchema,
  'about.mission': aboutMissionSchema,
  'about.stats': aboutStatsSchema,
  'about.faq': aboutFaqSchema,
} as const;

export type SiteContentKey = keyof typeof sectionSchemas;
export const SITE_CONTENT_KEYS = Object.keys(sectionSchemas) as SiteContentKey[];

export function isSiteContentKey(key: string): key is SiteContentKey {
  return Object.prototype.hasOwnProperty.call(sectionSchemas, key);
}

// Validates only the :key param up front; the body shape is validated per-key
// in the service (it depends on which section is being saved). body/query are
// passed through untouched so the validate middleware doesn't wipe them.
export const keyParamSchema = z.object({
  params: z.object({
    key: z.string().refine(isSiteContentKey, { message: 'Unknown section key' }),
  }),
  body: z.any(),
  query: z.any(),
});

// ---------------------------------------------------------------------------
// Default content — mirrors the original hardcoded markup exactly. Seeded on
// startup so the editor is pre-filled and the public site is unchanged.
// ---------------------------------------------------------------------------

export const DEFAULT_CONTENT: Record<SiteContentKey, unknown> = {
  'home.hero': {
    badge: '#1 Engineering Education Platform',
    headingPrefix: 'Master Skills with',
    headingHighlight: 'Pulchowk’s',
    headingSuffix: 'Finest Educators',
    paragraph:
      'Transform your engineering journey with expert-led courses from Pulchowk Engineering College. Join thousands of successful students.',
    stats: [
      { value: '12K+', label: 'Students' },
      { value: '20+', label: 'Courses' },
      { value: '95%', label: 'Success Rate' },
    ],
  },
  'home.stats': {
    stats: [
      { end: 1000, suffix: '+', label: 'Students Enrolled' },
      { end: 50, suffix: '+', label: 'Expert Teachers' },
      { end: 98, suffix: '%', label: 'Pass Rate' },
      { end: 10, suffix: '+', label: 'Active Courses' },
    ],
  },
  'home.advisor': {
    eyebrow: 'Advisory',
    heading: 'Message From\nOur Advisor',
    imageUrl: '/images/advisor.png',
    imageAlt: 'Campus Chief, Patan Multiple Campus',
    name: 'Campus Chief',
    title: 'Patan Multiple Campus',
    quotes: [
      'I am pleased to extend my best wishes to Dragon Academy, which has been instrumental in preparing students for B.E., B.Arch., and B.Sc. CSIT entrance exams. As the Campus Chief of Patan Multiple Campus, I commend the academy’s dedication to academic excellence and skill development.',
      'With a team of highly experienced educators and mentors, Dragon Academy ensures that students receive the best guidance and support. With the right effort and determination, students can achieve their goals and make meaningful contributions to society. I encourage all learners to stay committed and get benefited from the opportunities provided.',
    ],
  },
  'about.hero': {
    eyebrow: '00 — Our Story',
    heading: 'About Dragon\nEducation',
    paragraph:
      "Nepal's premier education institute dedicated to preparing students for IOE entrance exams and equipping them with language skills that open doors worldwide.",
  },
  'about.mission': {
    eyebrow: '01 — Mission',
    heading: "Empowering Nepal's\nNext Generation",
    bodyParagraphs: [
      "Dragon Education Foundation was established to bridge the gap between ambition and achievement for Nepal's students. We believe that with the right guidance, structured preparation, and modern learning tools, every student can reach their goal — whether that is clearing the IOE entrance, pursuing engineering, or building global language skills.",
      'Since 2015, we have been refining our approach through student feedback, exam analysis, and a relentless commitment to quality instruction. Today, we serve students from across the Kathmandu Valley and increasingly across Nepal through our hybrid and online programs.',
    ],
    missionLabel: 'Our Mission',
    missionText:
      'To provide accessible, high-quality education that empowers every Nepali student to excel in competitive exams and build skills for a global career — through expert instruction, technology, and personalized support.',
    visionLabel: 'Our Vision',
    visionText:
      "To become South Asia's most trusted education foundation — where academic excellence meets opportunity, and every student leaves prepared not just for an exam, but for a lifetime of growth.",
  },
  'about.stats': {
    stats: [
      { value: '1000+', label: 'Students Enrolled' },
      { value: '50+', label: 'Expert Teachers' },
      { value: '98%', label: 'Pass Rate' },
      { value: '2015', label: 'Founded' },
    ],
  },
  'about.faq': {
    eyebrow: '03 — FAQ',
    heading: 'Questions',
    faqs: [
      {
        question: 'What courses does Dragon Education Foundation offer?',
        answer:
          'We offer IOE entrance preparation programs, bridge courses for engineering and science, and language training in Japanese, Korean, and English. Each program is available online, offline, or hybrid.',
      },
      {
        question: 'How are classes delivered?',
        answer:
          'We offer three delivery modes — online (via Zoom), offline (in-person at our Baneshwor centre), and hybrid (mix of both). You can choose based on your location and schedule.',
      },
      {
        question: 'What is the batch size?',
        answer:
          'We keep batches intentionally small to ensure every student gets personal attention from instructors. Batch sizes are typically 20–30 students.',
      },
      {
        question: 'Are mock exams included in all plans?',
        answer:
          'Free users get access to a limited number of mock exams. Standard and Premium users receive more frequent mock sessions with detailed analytics and feedback.',
      },
      {
        question: 'How do I enroll?',
        answer:
          'Register on our platform, verify your account, then browse and enroll in your chosen course. Our team will contact you to assign you to the appropriate batch.',
      },
    ],
  },
};

// Validate a body against the schema for a given key. Throws ZodError on
// mismatch (translated to a 422 by the error handler).
export function parseSection(key: SiteContentKey, data: unknown) {
  return sectionSchemas[key].parse(data);
}
