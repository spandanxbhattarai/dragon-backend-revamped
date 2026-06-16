import {
  sendAccountVerifiedEmail,
  sendAnnouncementEmail,
  sendClassMaterialAddedEmail,
  sendContactReplyEmail,
  sendEventEmail,
  sendFeedbackReplyEmail,
  sendNewContactNotification,
  sendNewsletterEmail,
  sendNewUserAdminNotification,
  sendPasswordResetEmail,
} from '../../utils/email';

// nodemailer (and any SMTP provider) can fail at any moment — rate limits,
// network blips, bad recipient address. Email is never essential to the
// caller's success path, so every method here swallows errors and never
// throws. Use fire-and-forget at the call site.
async function safe(promise: Promise<unknown>): Promise<void> {
  try {
    await promise;
  } catch {
    // Intentionally silent.
  }
}

type AnnouncementPayload = Parameters<typeof sendAnnouncementEmail>[1];
type ClassMaterialPayload = Parameters<typeof sendClassMaterialAddedEmail>[1];
type EventPayload = Parameters<typeof sendEventEmail>[1];
type NewUserAdminPayload = Parameters<typeof sendNewUserAdminNotification>[0];
type AccountVerifiedPayload = Parameters<typeof sendAccountVerifiedEmail>[2];

export const mailService = {
  sendPasswordReset: (to: string, name: string, newPassword: string) =>
    safe(sendPasswordResetEmail(to, name, newPassword)),

  sendAccountVerified: (to: string, name: string, details: AccountVerifiedPayload) =>
    safe(sendAccountVerifiedEmail(to, name, details)),

  sendNewUserAdminNotification: (user: NewUserAdminPayload) =>
    safe(sendNewUserAdminNotification(user)),

  sendFeedbackReply: (
    to: string,
    name: string,
    originalMessage: string,
    replyText: string,
  ) => safe(sendFeedbackReplyEmail(to, name, originalMessage, replyText)),

  sendContactReply: (
    to: string,
    name: string,
    subject: string,
    originalMessage: string,
    replyText: string,
  ) => safe(sendContactReplyEmail(to, name, subject, originalMessage, replyText)),

  sendNewContactNotification: (payload: Parameters<typeof sendNewContactNotification>[0]) =>
    safe(sendNewContactNotification(payload)),

  sendAnnouncement: (recipients: string[], payload: AnnouncementPayload) =>
    safe(sendAnnouncementEmail(recipients, payload)),

  sendEvent: (recipients: string[], payload: EventPayload) =>
    safe(sendEventEmail(recipients, payload)),

  sendClassMaterialAdded: (recipients: string[], payload: ClassMaterialPayload) =>
    safe(sendClassMaterialAddedEmail(recipients, payload)),

  sendNewsletter: (recipients: string[], payload: Parameters<typeof sendNewsletterEmail>[1]) =>
    safe(sendNewsletterEmail(recipients, payload)),
};
