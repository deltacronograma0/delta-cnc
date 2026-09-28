# Supabase e segurança

O app usa `delta_app_state` para máquinas e equipes, Supabase Auth para autenticação e `delta_user_roles` para autorizar editores e administradores. Senhas não são armazenadas no estado do app, nos backups ou no navegador.

## Autenticação e gestão de acessos

1. Confirme que está no projeto Supabase correto.
2. Execute [SUPABASE_AUTH_MIGRATION.sql](SUPABASE_AUTH_MIGRATION.sql) no SQL Editor como owner.
3. O script copia e-mails/perfis das tabelas existentes, remove `pass` de `delta_users`, remove a coluna de usuários de `delta_app_state`, bloqueia o acesso às tabelas legadas e limita escrita aos perfis autenticados. Máquinas, equipes e dados operacionais são preservados.
4. Em **Authentication > URL Configuration**, defina o Site URL como `https://deltacronograma0.github.io/delta-cnc/` e adicione essa URL à lista de Redirect URLs.
5. O e-mail `deltacronograma@gmail.com` é o Administrador principal. Use o convite já enviado para essa conta e defina uma senha nova; depois entre no app.
6. Publique a função `supabase/functions/admin-users/index.ts` com `supabase functions deploy admin-users --project-ref eqeiwhdrreahuwigvkpt` ou pelo editor de Edge Functions do Dashboard.
7. Em **Edge Functions > Secrets**, configure `SUPABASE_SERVICE_ROLE_KEY` usando a chave `service_role` do projeto se o ambiente não a fornecer automaticamente. Essa chave fica somente no servidor e nunca no JavaScript do app.
8. Depois que a função estiver publicada e o Administrador principal entrar no app, somente `deltacronograma@gmail.com` poderá criar, redefinir ou excluir acessos em **Utilizadores**. Ele escolhe Editor ou Administrador e define uma senha temporária forte; os demais Administradores operam a produção, mas não gerem contas. A senha não é guardada pelo app. Os quatro perfis já estão em `public.delta_user_roles`.

## Segurança e dados

- Desative **Anonymous Sign-Ins** em **Authentication > Providers**. Visitantes continuam com leitura pública do cronograma; apenas usuários autenticados com perfil Editor ou Administrador podem escrever.
- `delta_user_roles` só permite ao usuário consultar o próprio perfil; o administrador pode consultar a lista. A Edge Function valida a sessão e o perfil Admin antes de criar, redefinir ou excluir contas.
- O bucket `delta-pdfs` permanece privado. Apenas perfis autenticados podem obter ou enviar PDFs.
- `delta_app_state` continua legível sem login para exibir o cronograma público. Se nomes de clientes ou cronogramas forem confidenciais, remova a policy `delta app state public read` e exija login também para leitura antes de divulgar o app.
- Configure backups automáticos no plano disponível e teste uma restauração periódica. Guarde uma cópia JSON exportada fora do dispositivo que opera o app.
- Use apenas a Project URL e Publishable Key no navegador. Nunca exponha `service_role` ou uma Secret Key.

## Conectar dispositivos

Em **Project Settings > API Keys**, copie a Project URL e a Publishable Key. No app, abra **Definições**, salve esses valores em cada dispositivo e entre com a conta Supabase Auth. O indicador do cabeçalho mostra somente **Sincronizado** ou **Sem conexão**.
