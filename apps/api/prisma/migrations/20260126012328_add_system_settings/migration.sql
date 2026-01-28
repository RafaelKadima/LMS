-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "primary_color" TEXT NOT NULL DEFAULT '#f97316',
    "secondary_color" TEXT NOT NULL DEFAULT '#141414',
    "login_bg_type" TEXT NOT NULL DEFAULT 'color',
    "login_bg_color" TEXT NOT NULL DEFAULT '#141414',
    "login_bg_media_url" TEXT,
    "logo_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
