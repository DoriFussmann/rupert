-- CreateEnum
CREATE TYPE "public"."FieldType" AS ENUM ('text', 'richtext', 'json', 'boolean', 'number', 'image', 'date');

-- Add temporary column
ALTER TABLE "public"."Field" ADD COLUMN "type_new" "public"."FieldType";

-- Update existing data to use enum values
UPDATE "public"."Field" SET "type_new" = 
  CASE 
    WHEN "type" = 'text' THEN 'text'::"public"."FieldType"
    WHEN "type" = 'number' THEN 'number'::"public"."FieldType"
    WHEN "type" = 'image' THEN 'image'::"public"."FieldType"
    WHEN "type" = 'json' THEN 'json'::"public"."FieldType"
    WHEN "type" = 'date' THEN 'date'::"public"."FieldType"
    ELSE 'text'::"public"."FieldType"
  END;

-- Make the new column required
ALTER TABLE "public"."Field" ALTER COLUMN "type_new" SET NOT NULL;

-- Drop old column and rename new column
ALTER TABLE "public"."Field" DROP COLUMN "type";
ALTER TABLE "public"."Field" RENAME COLUMN "type_new" TO "type";
