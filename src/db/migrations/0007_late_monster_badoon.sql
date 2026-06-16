ALTER TABLE "student_profiles" ADD COLUMN "initial_verification" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Backfill: students already verified at migration time are treated as
-- having received their initial verification, so re-verifying them later
-- (after an admin unverifies and re-verifies) will not resend the email.
UPDATE "student_profiles" sp
SET "initial_verification" = true
FROM "users" u
WHERE sp."user_id" = u."id" AND u."is_verified" = true;