DROP TABLE IF EXISTS "public"."turns";

CREATE TABLE "public"."turns" (
    "id" uuid NOT NULL,
    "room_id" uuid NOT NULL,
    "prompt" varchar,
    "created" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."rooms";

CREATE TABLE "public"."rooms" (
    "id" uuid NOT NULL,
    "created" timestamptz NOT NULL,
    "join_code" varchar NOT NULL,
    PRIMARY KEY ("id")
);

ALTER TABLE "public"."turns" ADD FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");


CREATE UNIQUE INDEX untitled_table_210_pkey ON public.rooms USING btree (id);
