-- Gravacao de crise numa unica chamada atomica. Issue #40.
--
-- Antes, salvar uma crise eram varios passos sem transacao entre eles: descobrir o
-- usuario, inserir a crise, e inserir cada fase num laco. Uma falha no meio deixava crise
-- incompleta no banco, sem nada indicando que estava incompleta. Nao era hipotese: a
-- auditoria encontrou 101 crises sem um unico fator desencadeante associado, porque o laco
-- dos fatores estourava depois de crise e fases ja estarem gravadas.
--
-- Uma funcao plpgsql roda dentro da transacao do comando que a chamou, entao uma excecao
-- em qualquer insert reverte todos os anteriores.
--
-- IDEMPOTENCIA: os inserts usam on conflict (id) do nothing. Isso depende da #44, que
-- passou a gerar os ids no aparelho. A fila de envio da T3.7 reenvia depois de timeout, e
-- reenvio de insert criaria duplicata; com o id do cliente como chave, o reenvio completa o
-- que faltou. Atualizar crise existente fica FORA daqui: "ultima escrita vence" depende de
-- comparar updated_at e e trabalho da T3.7.
--
-- SEGURANCA: security invoker, nao definer. A #73 deste projeto foi uma view com
-- SECURITY DEFINER que devolvia dado clinico de todos os pacientes ignorando a RLS. Com
-- invoker, os inserts abaixo passam pelas mesmas politicas que o app enfrentaria
-- diretamente. O search_path fixo evita que a funcao seja desviada por um schema plantado
-- no caminho de busca.

create or replace function public.salvar_crise(
  p_crise jsonb,
  p_fases jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_usuario_id bigint;
  v_crise_id   uuid;
  v_fase       jsonb;
begin
  -- Traducao de auth.uid() para usuarios.id. Hoje esta replicada em cinco lugares do app;
  -- centralizar aqui e o que a #33 pede.
  select id into v_usuario_id
    from public.usuarios
   where user_id = auth.uid();

  if v_usuario_id is null then
    raise exception 'Perfil do usuario nao encontrado';
  end if;

  v_crise_id := (p_crise->>'id')::uuid;

  if v_crise_id is null then
    raise exception 'A crise precisa vir com id gerado no aparelho';
  end if;

  insert into public.crise_enxaqueca (id, user_id, inicio_crise, fim_crise, updated_at)
  values (
    v_crise_id,
    v_usuario_id,
    (p_crise->>'inicio_crise')::timestamptz,
    (p_crise->>'fim_crise')::timestamptz,
    coalesce((p_crise->>'updated_at')::timestamptz, now())
  )
  on conflict (id) do nothing;

  for v_fase in select value from jsonb_array_elements(coalesce(p_fases, '[]'::jsonb))
  loop
    insert into public.registro_crise (
      id,
      crise_id,
      intensidade_dor,
      regiao_dor,
      lado,
      nivel_incapacidade,
      resumo,
      sintomas,
      medicamentos,
      medicamentos_livres,
      fatores,
      updated_at
    )
    values (
      (v_fase->>'id')::uuid,
      v_crise_id,
      (v_fase->>'intensidade_dor')::bigint,
      v_fase->>'regiao_dor',
      v_fase->>'lado',
      v_fase->>'nivel_incapacidade',
      v_fase->>'resumo',
      array(select jsonb_array_elements_text(coalesce(v_fase->'sintomas', '[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(v_fase->'medicamentos', '[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(v_fase->'medicamentos_livres', '[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(v_fase->'fatores', '[]'::jsonb))),
      coalesce((v_fase->>'updated_at')::timestamptz, now())
    )
    on conflict (id) do nothing;
  end loop;

  return v_crise_id;
end;
$$;

-- Funcao nasce executavel por PUBLIC no Postgres. Aqui isso incluiria o papel anon, que
-- usa a chave anonima publicada no repositorio.
revoke all on function public.salvar_crise(jsonb, jsonb) from public;
grant execute on function public.salvar_crise(jsonb, jsonb) to authenticated;
