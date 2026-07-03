-- -------------------------------------------------------------
-- TablePlus 26.6.0(730)
--
-- https://tableplus.com/
--
-- Database: ghostwriter_db
-- Generation Time: 2026-07-03 14:35:09.6920
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."turns";
-- Table Definition
CREATE TABLE "public"."turns" (
    "id" uuid NOT NULL,
    "room_id" uuid NOT NULL,
    "prompt" varchar,
    "created" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."rooms";
-- Table Definition
CREATE TABLE "public"."rooms" (
    "id" uuid NOT NULL,
    "created" timestamptz NOT NULL,
    "join_code" varchar NOT NULL,
    PRIMARY KEY ("id")
);

ALTER TABLE "public"."turns" ADD FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");


-- Indices
CREATE UNIQUE INDEX untitled_table_210_pkey ON public.rooms USING btree (id);
