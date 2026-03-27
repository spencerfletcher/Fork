create sequence "public"."recipes_id_seq";

create table "public"."recipes" (
    "id" integer not null default nextval('recipes_id_seq'::regclass),
    "title" text not null,
    "description" text,
    "prep_time_minutes" integer,
    "cook_time_minutes" integer,
    "servings" integer,
    "image_url" text,
    "ingredients" text not null,
    "instructions" text not null,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
);


alter sequence "public"."recipes_id_seq" owned by "public"."recipes"."id";

CREATE UNIQUE INDEX recipes_pkey ON public.recipes USING btree (id);

alter table "public"."recipes" add constraint "recipes_pkey" PRIMARY KEY using index "recipes_pkey";

grant delete on table "public"."recipes" to "anon";

grant insert on table "public"."recipes" to "anon";

grant references on table "public"."recipes" to "anon";

grant select on table "public"."recipes" to "anon";

grant trigger on table "public"."recipes" to "anon";

grant truncate on table "public"."recipes" to "anon";

grant update on table "public"."recipes" to "anon";

grant delete on table "public"."recipes" to "authenticated";

grant insert on table "public"."recipes" to "authenticated";

grant references on table "public"."recipes" to "authenticated";

grant select on table "public"."recipes" to "authenticated";

grant trigger on table "public"."recipes" to "authenticated";

grant truncate on table "public"."recipes" to "authenticated";

grant update on table "public"."recipes" to "authenticated";

grant delete on table "public"."recipes" to "service_role";

grant insert on table "public"."recipes" to "service_role";

grant references on table "public"."recipes" to "service_role";

grant select on table "public"."recipes" to "service_role";

grant trigger on table "public"."recipes" to "service_role";

grant truncate on table "public"."recipes" to "service_role";

grant update on table "public"."recipes" to "service_role";


