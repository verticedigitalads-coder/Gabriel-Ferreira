-- =============================================================================
-- Rodada da logo, entrega 3: o cliente sobe a própria logo pelas Configurações
-- (botão "Enviar imagem"), na pasta logos/<workspace_id>/.
-- Plano: C:\Users\gabri\.claude\plans\pasted-content-id-8f86-rodada-da-abstract-quasar.md
-- Gerado em: 2026-11-14
--
-- Antes (conferido por SELECT em 14/11/2026): bucket "logos" público, sem
-- file_size_limit e sem allowed_mime_types; nenhuma policy no schema storage,
-- então pela API só o painel (service_role) gravava. 5 arquivos na raiz (FL,
-- Ítalo e Serralheria), que esta migration não toca.
--
-- 1) Limites do bucket: só PNG, JPEG e WebP (sem SVG), até 5 MB. Quem aplica é
--    a API do Storage, no upload, inclusive no painel. O app reduz a imagem
--    antes (logo até 800 px, marca d'água até 1000 px); um PNG de 1000x1000
--    com transparência fica em até ~4 MB, então tudo o que o app gera cabe.
-- 2) Gravação (INSERT) só na pasta <workspace_id>/ dos workspaces de que o
--    usuário é membro, pela mesma subquery das policies de public (a RLS de
--    workspace_members, self_access, já limita às linhas do próprio usuário).
--    Qualquer membro pode enviar, como já grava em workspace_settings.
--    Sem UPDATE e sem DELETE: cada envio é um arquivo novo (o app usa
--    upsert: false e nome com timestamp). anon fica sem policy.
-- A leitura continua pela URL pública (bucket público não passa por policy de
-- SELECT). Não criar policy de SELECT: ela deixaria listar os arquivos das
-- outras empresas.
--
-- Aplicar só depois do bloco DO de teste (sempre aborta) e com autorização do
-- Gabriel, em modo Manual. O front com o botão só pode ir ao ar depois desta
-- migration: sem a policy, o upload falha.
-- =============================================================================

update storage.buckets
   set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'],
       file_size_limit = 5242880
 where id = 'logos';

create policy logos_insert_pasta_do_workspace
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] in (
      select wm.workspace_id::text
        from public.workspace_members wm
       where wm.user_id = (select auth.uid())
    )
  );
