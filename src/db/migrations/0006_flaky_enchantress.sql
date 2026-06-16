-- Privacy semantic change for advertisements:
--   old 'public'   → 'all'    (shown to everyone)
--   old 'enrolled' → 'guests' (intent reused: restrict to one audience)
-- Existing 'enrolled' rows previously meant "logged-in students only";
-- under the new model 'guests' means "non-authenticated only". Operators
-- should re-audit any pre-existing 'enrolled' ads after the migration.
UPDATE "advertisements" SET "privacy" = 'all'    WHERE "privacy" = 'public';--> statement-breakpoint
UPDATE "advertisements" SET "privacy" = 'guests' WHERE "privacy" = 'enrolled';--> statement-breakpoint
ALTER TABLE "advertisements" ALTER COLUMN "privacy" SET DEFAULT 'all';
