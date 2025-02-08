set statement_timeout
= 0
;
set lock_timeout
= 0
;
set idle_in_transaction_session_timeout
= 0
;
set client_encoding
= 'UTF8'
;
set standard_conforming_strings
= on
;
select pg_catalog.set_config('search_path', '', false)
;
set check_function_bodies
= false
;
set xmloption
= content
;
set client_min_messages
= warning
;
set row_security
= off
;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";


COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


create or replace function "public"."is_plan_owned_by_user"("plan_id_value" "uuid")
returns boolean
language "sql"
security definer
as $$SELECT EXISTS (
  SELECT 1 FROM plans
  WHERE (auth.uid() = owner_id) AND (id = plan_id_value)
);$$
;


alter function "public"."is_plan_owned_by_user"("plan_id_value" "uuid")
owner to "postgres"
;


create or replace function "public"."is_plan_shared_with_user"("plan_id_value" "uuid")
returns boolean
language "sql"
security definer
as $$SELECT EXISTS (
  SELECT 1 FROM plan_shares
  WHERE ((auth.email() = (shared_with_email)::text) AND (plan_id = plan_id_value))
);$$
;


alter function "public"."is_plan_shared_with_user"("plan_id_value" "uuid")
owner to "postgres"
;

set default_tablespace
= ''
;

set default_table_access_method
= "heap"
;


CREATE TABLE IF NOT EXISTS "public"."plan_shares" (
"shared_with_email" character varying NOT NULL,
"plan_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
"created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "plan_shares_shared_with_email_check" CHECK (("length"(("shared_with_email")::"text") < 100))
);


ALTER TABLE "public"."plan_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
"id" "uuid" NOT NULL,
"state" "jsonb" NOT NULL,
"created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
"updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
"owner_id" "uuid" NOT NULL,
"name" "text" NOT NULL,
"last_updated_by" "uuid",
    CONSTRAINT "plans_name_check" CHECK (("length"("name") < 50))
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


ALTER TABLE ONLY "public"."plan_shares"
    ADD CONSTRAINT "plan_shares_pkey" PRIMARY KEY ("shared_with_email", "plan_id");


ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "planner_states_pkey" PRIMARY KEY ("id");


CREATE UNIQUE INDEX "plans_owner_id_name_unique" ON "public"."plans" USING "btree" ("owner_id", "name");


ALTER TABLE ONLY "public"."plan_shares"
    ADD CONSTRAINT "plan_shares_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "auth"."users"("id");


ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


CREATE POLICY "Plan shares are viewable by their owners." ON "public"."plan_shares" FOR SELECT TO "authenticated" USING ("public"."is_plan_owned_by_user"("plan_id"));


CREATE POLICY "Plans are viewable by their owners." ON "public"."plans" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));


CREATE POLICY "Users can delete their own plans." ON "public"."plans" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));


CREATE POLICY "Users can edit plans that were shared with them." ON "public"."plans" FOR UPDATE TO "authenticated" USING ("public"."is_plan_shared_with_user"("id")) WITH CHECK ("public"."is_plan_shared_with_user"("id"));


CREATE POLICY "Users can insert their own plans." ON "public"."plans" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));


CREATE POLICY "Users can share their plans." ON "public"."plan_shares" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_plan_owned_by_user"("plan_id"));


CREATE POLICY "Users can unshare plans." ON "public"."plan_shares" FOR DELETE TO "authenticated" USING ("public"."is_plan_owned_by_user"("plan_id"));


CREATE POLICY "Users can update their own plans." ON "public"."plans" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "owner_id"));


CREATE POLICY "Users can update their plan shares." ON "public"."plan_shares" FOR UPDATE TO "authenticated" USING ("public"."is_plan_owned_by_user"("plan_id"));


CREATE POLICY "Users can view plan shares that were shared with them." ON "public"."plan_shares" FOR SELECT TO "authenticated" USING (( SELECT ("auth"."email"() = ("plan_shares"."shared_with_email")::"text")));


CREATE POLICY "Users can view plans that have been shared with them." ON "public"."plans" FOR SELECT TO "authenticated" USING ("public"."is_plan_shared_with_user"("id"));


ALTER TABLE "public"."plan_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."plans";


grant usage
on schema "public"
to "postgres"
;
grant usage
on schema "public"
to "anon"
;
grant usage
on schema "public"
to "authenticated"
;
grant usage
on schema "public"
to "service_role"
;


grant all
on function "public"."is_plan_owned_by_user"("plan_id_value" "uuid")
to "anon"
;
grant all
on function "public"."is_plan_owned_by_user"("plan_id_value" "uuid")
to "authenticated"
;
grant all
on function "public"."is_plan_owned_by_user"("plan_id_value" "uuid")
to "service_role"
;


grant all
on function "public"."is_plan_shared_with_user"("plan_id_value" "uuid")
to "anon"
;
grant all
on function "public"."is_plan_shared_with_user"("plan_id_value" "uuid")
to "authenticated"
;
grant all
on function "public"."is_plan_shared_with_user"("plan_id_value" "uuid")
to "service_role"
;


grant all
on table "public"."plan_shares"
to "anon"
;
grant all
on table "public"."plan_shares"
to "authenticated"
;
grant all
on table "public"."plan_shares"
to "service_role"
;


grant all
on table "public"."plans"
to "anon"
;
grant all
on table "public"."plans"
to "authenticated"
;
grant all
on table "public"."plans"
to "service_role"
;


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


reset all
;
