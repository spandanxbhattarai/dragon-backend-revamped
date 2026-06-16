CREATE TABLE "event_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"media_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcement_cta_buttons" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "announcement_ctas" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "announcement_cta_buttons" CASCADE;--> statement-breakpoint
DROP TABLE "announcement_ctas" CASCADE;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "announcement_resources" ADD COLUMN "media_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "category" varchar(100) DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "privacy" varchar(20) DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "media_id" uuid;--> statement-breakpoint
ALTER TABLE "event_resources" ADD CONSTRAINT "event_resources_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_resources" ADD CONSTRAINT "event_resources_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_resources" ADD CONSTRAINT "announcement_resources_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_resources" DROP COLUMN "material_name";--> statement-breakpoint
ALTER TABLE "announcement_resources" DROP COLUMN "file_type";--> statement-breakpoint
ALTER TABLE "announcement_resources" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "announcement_resources" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "announcements" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "announcements" DROP COLUMN "announced_date";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "event_type";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "organizer_name";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "organizer_email";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "organizer_phone";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "venue_name";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "venue_address";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "is_active";