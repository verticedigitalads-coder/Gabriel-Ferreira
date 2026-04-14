


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."consumo_materiais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "lead_id" "uuid",
    "material_id" "uuid",
    "quantidade" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consumo_materiais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contas_receber" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "descricao" "text" NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "data_vencimento" "date" NOT NULL,
    "data_recebimento" "date",
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "forma_recebimento" "text",
    "observacao" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contas_receber_forma_recebimento_check" CHECK (("forma_recebimento" = ANY (ARRAY['pix'::"text", 'boleto'::"text", 'transferencia'::"text", 'dinheiro'::"text", 'cartao'::"text"]))),
    CONSTRAINT "contas_receber_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'recebido'::"text", 'atrasado'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."contas_receber" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cotacoes_materiais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "fornecedor_id" "uuid",
    "material" "text" NOT NULL,
    "quantidade" numeric,
    "valor" numeric NOT NULL,
    "forma_pagamento" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "material_id" "uuid",
    "data" "date" DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE "public"."cotacoes_materiais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fornecedores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "nome" "text" NOT NULL,
    "telefone" "text",
    "endereco" "text",
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cnpj" "text",
    "nome_fantasia" "text",
    "categoria" "text",
    "status" "text" DEFAULT 'ativo'::"text" NOT NULL,
    "email" "text",
    "prazo_entrega" integer,
    "condicao_pagamento" "text",
    "logradouro" "text",
    "numero_endereco" "text",
    "cidade" "text",
    "estado" "text",
    CONSTRAINT "fornecedores_categoria_check" CHECK (("categoria" = ANY (ARRAY['materiais'::"text", 'servicos'::"text", 'equipamentos'::"text", 'transporte'::"text", 'outros'::"text"]))),
    CONSTRAINT "fornecedores_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'inativo'::"text", 'preferencial'::"text"])))
);


ALTER TABLE "public"."fornecedores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "nome" "text",
    "telefone" "text",
    "email" "text",
    "servico" "text",
    "status" "text",
    "temperatura" "text",
    "origem" "text",
    "prazo_cliente" "text",
    "probabilidade_manual" integer,
    "prioridade_score" integer,
    "prioridade_level" "text",
    "ultimo_contato" timestamp with time zone,
    "proximo_contato" timestamp with time zone,
    "orcamento_enviado" boolean,
    "valor_orcado" numeric,
    "data_orcamento" timestamp with time zone,
    "data_execucao" timestamp with time zone,
    "resumo" "text",
    "observacoes" "text",
    "historico" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "endereco" "text"
);

ALTER TABLE ONLY "public"."leads" REPLICA IDENTITY FULL;


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."materiais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "nome" "text" NOT NULL,
    "unidade" "text",
    "estoque" numeric DEFAULT 0,
    "estoque_minimo" numeric DEFAULT 5,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "categoria" "text"
);


ALTER TABLE "public"."materiais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "numero" "text",
    "valor" numeric,
    "data" timestamp with time zone,
    "status" "text",
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."operacional_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "titulo" "text",
    "descricao" "text",
    "data" timestamp with time zone,
    "tipo" "text",
    "prioridade" "text",
    "concluido" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pendente'::"text"
);

ALTER TABLE ONLY "public"."operacional_tasks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."operacional_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orcamentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "numero" "text",
    "itens" "jsonb",
    "subtotal" numeric,
    "desconto" numeric,
    "total" numeric,
    "status" "text",
    "observacoes" "text",
    "validade_em_dias" integer,
    "historico" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "multiplicador" numeric,
    "cliente_nome" "text",
    "cliente_telefone" "text",
    "cliente_endereco" "text"
);

ALTER TABLE ONLY "public"."orcamentos" REPLICA IDENTITY FULL;


ALTER TABLE "public"."orcamentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "tipo" "text",
    "descricao" "text",
    "valor" numeric,
    "data" timestamp with time zone,
    "categoria" "text",
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid",
    "user_id" "uuid",
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "workspace_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "owner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "segment" "text" DEFAULT 'metalurgica'::"text"
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."consumo_materiais"
    ADD CONSTRAINT "consumo_materiais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contas_receber"
    ADD CONSTRAINT "contas_receber_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cotacoes_materiais"
    ADD CONSTRAINT "cotacoes_materiais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fornecedores"
    ADD CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."materiais"
    ADD CONSTRAINT "materiais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notas"
    ADD CONSTRAINT "notas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operacional_tasks"
    ADD CONSTRAINT "operacional_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_user_id_key" UNIQUE ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumo_materiais"
    ADD CONSTRAINT "consumo_materiais_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consumo_materiais"
    ADD CONSTRAINT "consumo_materiais_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materiais"("id");



ALTER TABLE ONLY "public"."consumo_materiais"
    ADD CONSTRAINT "consumo_materiais_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contas_receber"
    ADD CONSTRAINT "contas_receber_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contas_receber"
    ADD CONSTRAINT "contas_receber_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cotacoes_materiais"
    ADD CONSTRAINT "cotacoes_materiais_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cotacoes_materiais"
    ADD CONSTRAINT "cotacoes_materiais_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materiais"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cotacoes_materiais"
    ADD CONSTRAINT "cotacoes_materiais_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fornecedores"
    ADD CONSTRAINT "fornecedores_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."materiais"
    ADD CONSTRAINT "materiais_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notas"
    ADD CONSTRAINT "notas_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notas"
    ADD CONSTRAINT "notas_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operacional_tasks"
    ADD CONSTRAINT "operacional_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."operacional_tasks"
    ADD CONSTRAINT "operacional_tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete leads" ON "public"."leads" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "leads"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = 'admin'::"text")))));



CREATE POLICY "Allow user to create own workspace" ON "public"."workspaces" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Allow user to view own workspace" ON "public"."workspaces" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Leads delete" ON "public"."leads" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Leads insert" ON "public"."leads" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Leads select" ON "public"."leads" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Leads update" ON "public"."leads" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Notas delete" ON "public"."notas" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Notas insert" ON "public"."notas" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Notas select" ON "public"."notas" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Notas update" ON "public"."notas" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Operacional delete" ON "public"."operacional_tasks" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Operacional insert" ON "public"."operacional_tasks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Operacional select" ON "public"."operacional_tasks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Operacional update" ON "public"."operacional_tasks" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Orcamentos delete" ON "public"."orcamentos" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Orcamentos insert" ON "public"."orcamentos" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Orcamentos select" ON "public"."orcamentos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Orcamentos update" ON "public"."orcamentos" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Transactions delete" ON "public"."transactions" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Transactions insert" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Transactions select" ON "public"."transactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Transactions update" ON "public"."transactions" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can insert membership" ON "public"."workspace_members" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert workspace if authenticated" ON "public"."workspaces" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can see memberships" ON "public"."workspace_members" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can see their workspaces" ON "public"."workspaces" FOR SELECT USING (("id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Workspace members can delete orcamentos" ON "public"."orcamentos" FOR DELETE TO "authenticated" USING (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Workspace members can insert leads" ON "public"."leads" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "leads"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Workspace members can insert orcamentos" ON "public"."orcamentos" FOR INSERT TO "authenticated" WITH CHECK (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Workspace members can select leads" ON "public"."leads" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "leads"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Workspace members can select orcamentos" ON "public"."orcamentos" FOR SELECT TO "authenticated" USING (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Workspace members can update leads" ON "public"."leads" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Workspace members can update orcamentos" ON "public"."orcamentos" FOR UPDATE TO "authenticated" USING (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."consumo_materiais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contas_receber" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cotacoes_materiais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fornecedores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."materiais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."operacional_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orcamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "self_access" ON "public"."workspace_members" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspace access" ON "public"."leads" TO "authenticated" USING (("workspace_id" = "auth"."uid"()));



CREATE POLICY "workspace members can manage contas_receber" ON "public"."contas_receber" TO "authenticated" USING (("workspace_id" = ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_consumo" ON "public"."consumo_materiais" TO "authenticated" USING (("workspace_id" = ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_cotacoes" ON "public"."cotacoes_materiais" TO "authenticated" USING (("workspace_id" = ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_fornecedores" ON "public"."fornecedores" TO "authenticated" USING (("workspace_id" = ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."consumo_materiais" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."cotacoes_materiais" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."fornecedores" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."leads" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."materiais" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."notas" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."operacional_tasks" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."orcamentos" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_isolation" ON "public"."transactions" USING (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1))) WITH CHECK (("workspace_id" = ( SELECT "wm"."workspace_id"
   FROM "public"."workspace_members" "wm"
  WHERE ("wm"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "workspace_materiais" ON "public"."materiais" TO "authenticated" USING (("workspace_id" = ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"())
 LIMIT 1)));



ALTER TABLE "public"."workspace_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspace_owner_access" ON "public"."workspaces" USING (("id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"())))) WITH CHECK (("id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."consumo_materiais" TO "anon";
GRANT ALL ON TABLE "public"."consumo_materiais" TO "authenticated";
GRANT ALL ON TABLE "public"."consumo_materiais" TO "service_role";



GRANT ALL ON TABLE "public"."contas_receber" TO "anon";
GRANT ALL ON TABLE "public"."contas_receber" TO "authenticated";
GRANT ALL ON TABLE "public"."contas_receber" TO "service_role";



GRANT ALL ON TABLE "public"."cotacoes_materiais" TO "anon";
GRANT ALL ON TABLE "public"."cotacoes_materiais" TO "authenticated";
GRANT ALL ON TABLE "public"."cotacoes_materiais" TO "service_role";



GRANT ALL ON TABLE "public"."fornecedores" TO "anon";
GRANT ALL ON TABLE "public"."fornecedores" TO "authenticated";
GRANT ALL ON TABLE "public"."fornecedores" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."materiais" TO "anon";
GRANT ALL ON TABLE "public"."materiais" TO "authenticated";
GRANT ALL ON TABLE "public"."materiais" TO "service_role";



GRANT ALL ON TABLE "public"."notas" TO "anon";
GRANT ALL ON TABLE "public"."notas" TO "authenticated";
GRANT ALL ON TABLE "public"."notas" TO "service_role";



GRANT ALL ON TABLE "public"."operacional_tasks" TO "anon";
GRANT ALL ON TABLE "public"."operacional_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."operacional_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."orcamentos" TO "anon";
GRANT ALL ON TABLE "public"."orcamentos" TO "authenticated";
GRANT ALL ON TABLE "public"."orcamentos" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







