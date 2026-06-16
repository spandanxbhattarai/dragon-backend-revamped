CREATE TABLE "home_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"video_media_id" uuid,
	"banner_image_url" text,
	"banner_media_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "home_videos" ADD CONSTRAINT "home_videos_video_media_id_media_id_fk" FOREIGN KEY ("video_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_videos" ADD CONSTRAINT "home_videos_banner_media_id_media_id_fk" FOREIGN KEY ("banner_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;