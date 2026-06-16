import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

// ─── Swiss design tokens ──────────────────────────────────────────────────────
// International Typographic Style: one accent, a strict grayscale ramp, a single
// sans-serif family, hard rules, sharp corners, generous whitespace, and a clear
// type hierarchy driven by size/weight rather than colour.
const ACCENT = '#010794'; // brand navy — the only colour besides the grayscale ramp
const INK = '#111111'; // headlines / key values
const BODY = '#444444'; // running text
const MUTED = '#8a8a8a'; // labels, captions
const FAINT = '#b5b5b5'; // footer
const HAIRLINE = '#e6e6e6'; // thin rules / table borders
const PANEL = '#f6f6f7'; // callout panels
const PAGE = '#efefef'; // page background
const FONT = `'Helvetica Neue',Helvetica,Arial,sans-serif`;

const year = (): number => new Date().getFullYear();

// ─── Building blocks ──────────────────────────────────────────────────────────

const space = (h: number): string =>
  `<div style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</div>`;

const blackRule = `<div style="height:2px;background:${INK};line-height:2px;font-size:0;">&nbsp;</div>`;
const hair = `<div style="height:1px;background:${HAIRLINE};line-height:1px;font-size:0;">&nbsp;</div>`;

const eyebrow = (text: string, color: string = MUTED): string =>
  `<p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${color};">${text}</p>`;

const headline = (text: string): string =>
  `<h1 style="margin:14px 0 0;font-size:28px;font-weight:700;color:${INK};line-height:1.18;letter-spacing:-0.02em;">${text}</h1>`;

const lede = (text: string): string =>
  `<p style="margin:10px 0 0;font-size:14px;color:${MUTED};line-height:1.6;">${text}</p>`;

const para = (text: string): string =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${BODY};">${text}</p>`;

// Section header: brand + section eyebrow, headline, optional sub, then a thick
// black rule that anchors the grid.
const header = (section: string, title: string, subtitle?: string): string => `
  ${eyebrow(`Dragon Education Foundation &nbsp;/&nbsp; ${section}`)}
  ${headline(title)}
  ${subtitle ? lede(subtitle) : ''}
  ${space(28)}
  ${blackRule}
  ${space(28)}
`;

// Left-aligned solid accent block — sharp corners, uppercase, wide tracking.
const button = (text: string, href: string): string =>
  `<a href="${href}" style="display:inline-block;background:${ACCENT};color:#ffffff;padding:14px 30px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;font-family:${FONT};">${text} &rarr;</a>`;

// Accent-bordered callout panel.
const panel = (inner: string): string =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${PANEL};border-left:3px solid ${ACCENT};margin:0 0 24px;">
     <tr><td style="padding:20px 24px;">${inner}</td></tr>
   </table>`;

// Label / value rows with hairline separators.
const dataRows = (pairs: Array<[string, string]>): string => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    ${pairs
      .map(
        ([label, value]) => `
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid ${HAIRLINE};width:150px;vertical-align:top;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">${label}</span>
        </td>
        <td style="padding:11px 0 11px 20px;border-bottom:1px solid ${HAIRLINE};vertical-align:top;">
          <span style="font-size:14px;color:${INK};font-weight:500;">${value}</span>
        </td>
      </tr>`,
      )
      .join('')}
  </table>`;

// Eyebrow label + paragraph — used for "Action Required" / closing notes.
const note = (label: string, text: string, color: string = ACCENT): string =>
  `${eyebrow(label, color)}<p style="margin:7px 0 0;font-size:14px;line-height:1.7;color:${BODY};">${text}</p>`;

// Bordered quote block (feedback / response).
const quoteBlock = (label: string, text: string, accent: string): string =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${PANEL};border-left:3px solid ${accent};margin:0 0 16px;">
     <tr><td style="padding:18px 22px;">
       ${eyebrow(label, accent === ACCENT ? ACCENT : MUTED)}
       <p style="margin:9px 0 0;font-size:14px;line-height:1.7;color:${INK};">${text}</p>
     </td></tr>
   </table>`;

// Outer shell: page, white card (no radius, no shadow), hairline footer.
const baseTemplate = (content: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Dragon Education Foundation</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};font-family:${FONT};-webkit-font-smoothing:antialiased;color:${BODY};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${PAGE};padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td style="padding:40px 44px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:0 44px;">${hair}</td>
          </tr>
          <tr>
            <td style="padding:18px 44px 36px;">
              <p style="margin:0;font-size:11px;color:${FAINT};line-height:1.6;">
                &copy; ${year()} Dragon Education Foundation &nbsp;&mdash;&nbsp; Automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Core send function ───────────────────────────────────────────────────────

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });
  } catch {
    // Silent — nodemailer can fail transiently; callers should not be affected.
  }
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const PLAN_LABEL: Record<'free' | 'half' | 'paid', string> = {
  free: 'Free',
  half: 'Half',
  paid: 'Full',
};

const stripHtmlToText = (raw: string): string =>
  raw
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

// Feature list rendered with small accent squares — a Swiss bullet.
const buildFeatureBullets = (raw?: string | null): string => {
  if (!raw) return '';
  const lines = stripHtmlToText(raw)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return '';
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 8px;">
      ${lines
        .map(
          (line) => `
        <tr>
          <td width="20" style="vertical-align:top;padding:5px 0;">
            <span style="display:inline-block;width:7px;height:7px;background:${ACCENT};"></span>
          </td>
          <td style="padding:3px 0;font-size:14px;color:${BODY};line-height:1.6;">${line}</td>
        </tr>`,
        )
        .join('')}
    </table>
  `;
};

// ─── Account Verified Email ───────────────────────────────────────────────────

export const sendAccountVerifiedEmail = async (
  to: string,
  name: string,
  details: {
    plan: 'free' | 'half' | 'paid';
    courseTitle?: string | null;
    planFeatures?: string | null;
    portalUrl?: string;
  },
): Promise<void> => {
  const planLabel = PLAN_LABEL[details.plan] ?? 'Free';
  const featureBlock = buildFeatureBullets(details.planFeatures);

  const content = `
    ${header('Account Verified', 'Your account has been verified', `An administrator approved your account — you now have full access on the ${planLabel} plan.`)}
    ${para(`Hi <strong style="color:${INK};">${name}</strong>,`)}
    ${para('Your account is active. Here are the details of the plan you selected during registration.')}
    ${panel(
      `${eyebrow('Your Plan', ACCENT)}
       <p style="margin:9px 0 0;font-size:20px;font-weight:700;color:${INK};letter-spacing:-0.01em;">${planLabel} Plan</p>
       ${details.courseTitle ? `<p style="margin:12px 0 0;font-size:13px;color:${BODY};"><span style="color:${MUTED};">Enrolled course &mdash;</span> ${details.courseTitle}</p>` : ''}`,
    )}
    ${
      featureBlock
        ? `${eyebrow(`On the ${planLabel} plan`, MUTED)}${space(12)}${featureBlock}`
        : para(`Log in to your dashboard to start exploring the materials and features available on the ${planLabel} plan.`)
    }
    ${details.portalUrl ? `${space(8)}${button('Open Dashboard', details.portalUrl)}${space(28)}` : space(8)}
    ${hair}
    ${space(20)}
    ${note('Need Help', 'If you have any questions about your plan or getting started, reach out to our support team any time.', MUTED)}
  `;
  await sendEmail(to, 'Your Account Has Been Verified — Dragon Education Foundation', baseTemplate(content));
};

// ─── Password Reset Email ─────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  newPassword: string,
): Promise<void> => {
  const content = `
    ${header('Account Security', 'Your password has been reset', 'An administrator reset your account password. Use the new credentials below to sign in.')}
    ${para(`Hi <strong style="color:${INK};">${name}</strong>,`)}
    ${panel(
      `${eyebrow('New Password', ACCENT)}
       <p style="margin:9px 0 0;font-size:22px;font-weight:700;font-family:'SF Mono',Menlo,Consolas,monospace;color:${INK};letter-spacing:0.01em;">${newPassword}</p>
       <p style="margin:12px 0 0;font-size:13px;color:${MUTED};"><span style="color:${MUTED};">Account &mdash;</span> ${to}</p>`,
    )}
    ${note('Action Required', 'For your security, sign in and change this password immediately.')}
    ${space(24)}
    ${hair}
    ${space(20)}
    ${note('Didn’t Expect This?', 'If you did not request this change or believe it was made in error, contact our support team immediately.', MUTED)}
  `;
  await sendEmail(to, 'Your Password Has Been Reset — Dragon Education Foundation', baseTemplate(content));
};

// ─── Class Material Added Email ───────────────────────────────────────────────

export const sendClassMaterialAddedEmail = async (
  recipientEmails: string[],
  material: {
    title: string;
    description: string;
    courseName: string;
    portalUrl: string;
  },
): Promise<void> => {
  if (recipientEmails.length === 0) return;

  const content = `
    ${header('New Material', material.title, `Added to your course &mdash; ${material.courseName}`)}
    ${para(material.description)}
    ${button('View in Dashboard', material.portalUrl)}
    ${space(28)}
    ${hair}
    ${space(20)}
    ${note('Access', 'Log in to the portal to download or view this material. It is only available to students enrolled in this course.', MUTED)}
  `;

  const html = baseTemplate(content);
  const promises = recipientEmails.map((email) =>
    sendEmail(email, `New Material Added: ${material.title}`, html),
  );
  await Promise.allSettled(promises);
};

// ─── Announcement Email ───────────────────────────────────────────────────────

export const sendAnnouncementEmail = async (
  subscriberEmails: string[],
  announcement: {
    title: string;
    content: string[];
    announcedDate: string;
  },
): Promise<void> => {
  if (subscriberEmails.length === 0) return;

  const contentParagraphs = announcement.content.map((p) => para(p)).join('');

  const content = `
    ${header('Announcement', announcement.title, announcement.announcedDate)}
    ${contentParagraphs}
    ${hair}
    ${space(20)}
    ${note('Why You Got This', 'You are receiving this because you subscribed to Dragon Education Foundation announcements.', MUTED)}
  `;

  const html = baseTemplate(content);
  const promises = subscriberEmails.map((email) =>
    sendEmail(email, `Announcement: ${announcement.title}`, html),
  );
  await Promise.allSettled(promises);
};

// ─── Newsletter Broadcast Email ───────────────────────────────────────────────

export const sendNewsletterEmail = async (
  subscriberEmails: string[],
  payload: { subject: string; content: string },
): Promise<void> => {
  if (subscriberEmails.length === 0) return;

  const content = `
    ${header('Newsletter', payload.subject)}
    <div style="font-size:15px;line-height:1.7;color:${BODY};">${payload.content}</div>
    ${space(16)}
    ${hair}
    ${space(20)}
    ${note('Why You Got This', 'You are receiving this because you subscribed to Dragon Education Foundation updates.', MUTED)}
  `;

  const html = baseTemplate(content);
  const promises = subscriberEmails.map((email) => sendEmail(email, payload.subject, html));
  await Promise.allSettled(promises);
};

// ─── Event Email ──────────────────────────────────────────────────────────────

export const sendEventEmail = async (
  subscriberEmails: string[],
  event: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    venueName: string;
    venueAddress: string;
    eventType: string;
  },
): Promise<void> => {
  if (subscriberEmails.length === 0) return;

  const content = `
    ${header(`Upcoming Event &nbsp;/&nbsp; ${event.eventType}`, event.title)}
    ${para(event.description)}
    ${dataRows([
      ['Starts', event.startDate],
      ['Ends', event.endDate],
      ['Venue', event.venueName],
      ['Address', event.venueAddress],
    ])}
    ${space(28)}
    ${hair}
    ${space(20)}
    ${note('Why You Got This', 'You are receiving this because you subscribed to Dragon Education Foundation event notifications.', MUTED)}
  `;

  const html = baseTemplate(content);
  const promises = subscriberEmails.map((email) =>
    sendEmail(email, `Event: ${event.title}`, html),
  );
  await Promise.allSettled(promises);
};

// ─── Admin — New User Registration Notification ───────────────────────────────

export const sendNewUserAdminNotification = async (user: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  plan?: string;
  courseTitle?: string;
}): Promise<void> => {
  const planLabel = user.plan === 'half' ? 'Half' : user.plan === 'paid' ? 'Full' : 'Free';
  const registeredAt = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const rows: Array<[string, string]> = [
    ['Full Name', `${user.firstName} ${user.lastName}`],
    ['Email', user.email],
    ['Phone', user.phone],
    ['Role', user.role.charAt(0).toUpperCase() + user.role.slice(1)],
  ];
  if (user.plan) rows.push(['Plan', planLabel]);
  if (user.courseTitle) rows.push(['Course', user.courseTitle]);
  rows.push(['Registered', registeredAt]);

  const content = `
    ${header('Admin Notification', 'New registration', 'A new user has completed registration and is pending verification.')}
    ${dataRows(rows)}
    ${space(28)}
    ${hair}
    ${space(20)}
    ${note('Action Required', 'Log in to the admin dashboard to review and verify this account before the user can access the platform.')}
  `;

  await sendEmail(
    env.ADMIN_EMAIL,
    `New Registration: ${user.firstName} ${user.lastName}`,
    baseTemplate(content),
  );
};

// ─── Feedback Reply Email ─────────────────────────────────────────────────────

export const sendFeedbackReplyEmail = async (
  to: string,
  name: string,
  originalMessage: string,
  replyText: string,
): Promise<void> => {
  const content = `
    ${header('Feedback', 'We’ve responded to your feedback')}
    ${para(`Hi <strong style="color:${INK};">${name}</strong>,`)}
    ${para('Thank you for taking the time to share your experience. Our team reviewed your feedback and wanted to respond personally.')}
    ${quoteBlock('Your Feedback', `&ldquo;${originalMessage}&rdquo;`, '#cfcfcf')}
    ${quoteBlock('Our Response', replyText, ACCENT)}
    ${space(8)}
    ${hair}
    ${space(20)}
    ${note('Still Have Questions?', 'We value your feedback and look forward to serving you better. Don’t hesitate to reach out any time.', MUTED)}
  `;
  await sendEmail(to, 'We Responded to Your Feedback — Dragon Education Foundation', baseTemplate(content));
};

// ─── Contact Reply Email ──────────────────────────────────────────────────────

export const sendContactReplyEmail = async (
  to: string,
  name: string,
  subject: string,
  originalMessage: string,
  replyText: string,
): Promise<void> => {
  const content = `
    ${header('Contact', 'A reply to your message')}
    ${para(`Hi <strong style="color:${INK};">${name}</strong>,`)}
    ${para('Thank you for reaching out to us. Our team has reviewed your message and wanted to respond.')}
    ${quoteBlock('Subject', subject, '#cfcfcf')}
    ${quoteBlock('Your Message', `&ldquo;${originalMessage}&rdquo;`, '#cfcfcf')}
    ${quoteBlock('Our Response', replyText, ACCENT)}
    ${space(8)}
    ${hair}
    ${space(20)}
    ${note('Still Have Questions?', 'Feel free to reply or reach out again any time — we’re always happy to help.', MUTED)}
  `;
  await sendEmail(to, `Re: ${subject} — Dragon Education Foundation`, baseTemplate(content));
};

// ─── New Contact Message — Admin Notification ─────────────────────────────────

export const sendNewContactNotification = async (payload: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}): Promise<void> => {
  const rows: Array<[string, string]> = [
    ['Name', payload.name],
    ['Email', payload.email],
  ];
  if (payload.phone) rows.push(['Phone', payload.phone]);
  rows.push(['Subject', payload.subject]);

  const content = `
    ${header('Admin Notification', 'New contact message', 'Someone submitted the contact form on the website.')}
    ${dataRows(rows)}
    ${space(24)}
    ${quoteBlock('Message', payload.message, ACCENT)}
    ${space(8)}
    ${hair}
    ${space(20)}
    ${note('Action Required', 'Log in to the admin dashboard (Messages) to review and reply to this enquiry.')}
  `;
  await sendEmail(env.ADMIN_EMAIL, `New Contact Message: ${payload.subject}`, baseTemplate(content));
};
