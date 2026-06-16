CREATE TABLE IF NOT EXISTS "analytics_visitor_sessions" (
	"session_token" varchar(255) NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_materials" ALTER COLUMN "file_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "access_plans" text[] DEFAULT ARRAY['free','half','paid']::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "class_materials" ADD COLUMN IF NOT EXISTS "media_id" uuid;--> statement-breakpoint
ALTER TABLE "class_materials" ADD COLUMN IF NOT EXISTS "course_id" uuid;--> statement-breakpoint
ALTER TABLE "advertisements" ADD COLUMN IF NOT EXISTS "privacy" varchar(20) DEFAULT 'public' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_materials" ADD CONSTRAINT "class_materials_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "class_materials" ADD CONSTRAINT "class_materials_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
