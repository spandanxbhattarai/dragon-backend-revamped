CREATE TYPE "public"."gallery_media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"media_type" "gallery_media_type" DEFAULT 'image' NOT NULL,
	"media_url" text NOT NULL,
	"media_id" uuid,
	"thumbnail_url" text,
	"thumbnail_media_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_thumbnail_media_id_media_id_fk" FOREIGN KEY ("thumbnail_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Migrate existing home videos into the new gallery (as video items). The
-- home_videos table is dropped in the next migration, after this copy runs.
INSERT INTO "gallery_items"
  ("id", "title", "description", "media_type", "media_url", "media_id",
   "thumbnail_url", "thumbnail_media_id", "position", "is_active", "created_at", "updated_at")
SELECT "id", "title", "description", 'video', "video_url", "video_media_id",
   "banner_image_url", "banner_media_id", "position", "is_active", "created_at", "updated_at"
FROM "home_videos";