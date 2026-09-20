-- Politicas de UPDATE e DELETE em crise_enxaqueca. Issue #77.
--
-- A tabela tinha politica apenas para INSERT e SELECT. Sem politica, a operacao e
-- negada por padrao, entao editar ou apagar uma crise falhava. Isso era coerente
-- enquanto a crise era registro historico: o app montava tudo em memoria e gravava
-- uma unica vez no fim do episodio.
--
-- O modelo offline muda o requisito. A crise passa a ser criada no aparelho quando
-- comeca e atualizada durante o episodio, conforme intensidade, medicamentos e
-- sintomas vao sendo registrados, e cada atualizacao e um UPDATE. A remocao logica
-- da T3.3 tambem depende de UPDATE.
--
-- A condicao repete a indirecao das duas politicas que ja existem na tabela:
-- crise_enxaqueca.user_id aponta para usuarios.id, e quem guarda o id de
-- autenticacao e usuarios.user_id. Comparar user_id com auth.uid() diretamente
-- produziria uma regra que nunca casa, bloqueando tudo em silencio.

create policy "Usuario pode atualizar suas crises"
  on public.crise_enxaqueca
  for update
  to authenticated
  using (
    user_id in (
      select usuarios.id
      from public.usuarios
      where usuarios.user_id = auth.uid()
    )
  )
  -- O with check impede que um update mova a crise para outro dono.
  with check (
    user_id in (
      select usuarios.id
      from public.usuarios
      where usuarios.user_id = auth.uid()
    )
  );

create policy "Usuario pode apagar suas crises"
  on public.crise_enxaqueca
  for delete
  to authenticated
  using (
    user_id in (
      select usuarios.id
      from public.usuarios
      where usuarios.user_id = auth.uid()
    )
  );
