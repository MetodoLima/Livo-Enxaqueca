-- Tira o papel anon da lista de quem pode executar salvar_crise. Issue #40.
--
-- A migration anterior fez "revoke all on function ... from public" e concedeu execute a
-- authenticated, o que parecia suficiente. Nao era: o Supabase concede execute em funcoes
-- do schema public para anon, authenticated e service_role por ALTER DEFAULT PRIVILEGES,
-- e revogar de PUBLIC nao alcanca um grant feito a um papel nomeado. Conferido em
-- information_schema.role_routine_grants depois de aplicar: anon estava lá.
--
-- Nao houve exposicao de dado. A funcao e security invoker e comeca resolvendo
-- auth.uid(); chamada com a chave anonima, ela levanta "Perfil do usuario nao encontrado"
-- antes de qualquer insert. Testado por POST em /rest/v1/rpc/salvar_crise, que respondeu
-- 400 com essa mensagem.
--
-- O revoke entra como defesa em profundidade: sem execute, o endpoint nem chega a rodar a
-- funcao. A chave anonima esta publicada num repositorio publico, entao o que anon pode
-- chamar e o que qualquer pessoa pode chamar.

revoke all on function public.salvar_crise(jsonb, jsonb) from anon;
