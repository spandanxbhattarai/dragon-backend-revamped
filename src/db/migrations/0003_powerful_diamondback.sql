ALTER TABLE "announcements" ADD COLUMN "privacy" varchar(20) DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;