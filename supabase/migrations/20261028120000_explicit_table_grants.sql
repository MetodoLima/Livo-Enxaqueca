revoke all on table
  public.usuarios,
  public.crise_enxaqueca,
  public.registro_crise,
  public.registro_diario,
  public.registro_momento,
  public.perguntas_setup,
  public.respostas_setup
from anon, authenticated, service_role;

revoke all on table
  public.opcoes_pergunta,
  public.sensacao_dor,
  public.sensacao_dor_registro_crise
from anon, authenticated;

grant select, insert, update on table public.usuarios to authenticated, service_role;

grant select, insert, update, delete on table
  public.crise_enxaqueca,
  public.registro_crise,
  public.registro_diario,
  public.registro_momento,
  public.respostas_setup
to authenticated, service_role;

grant select on table public.perguntas_setup to authenticated, service_role;

grant select on table public.perguntas_setup to anon;

revoke all on all sequences in schema public from anon;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on functions from anon;
