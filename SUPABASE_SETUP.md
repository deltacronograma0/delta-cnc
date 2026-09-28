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
8. Depois que a função estiver publicada, todos os Administradores podem criar, redefinir senha e excluir contas Editor em **Utilizadores**. Somente `deltacronograma@gmail.com` pode promover, rebaixar ou gerir outros Administradores. A senha definida fica ativa até um Administrador redefini-la; ela é enviada à função segura e não é guardada no app. Os perfis estão em `public.delta_user_roles`.

## Segurança e dados

- Desative **Anonymous Sign-Ins** em **Authentication > Providers**. Visitantes continuam com leitura pública do cronograma; apenas usuários autenticados com perfil Editor ou Administrador podem escrever.
- `delta_user_roles` só permite ao usuário consultar o próprio perfil; administradores podem consultar a lista. A Edge Function valida a sessão, permite a todos os Admins gerir Editores e reserva mudanças de contas Admin ao principal.
- O bucket `delta-pdfs` permanece privado. Apenas perfis autenticados podem obter ou enviar PDFs.
- A importação em lote só registra uma OS se o PDF tiver sido confirmado no Storage. Se o Storage estiver indisponível, a OS não é publicada sem o anexo; recupere o bucket `delta-pdfs` e tente novamente.
- `delta_app_state` continua legível sem login para exibir o cronograma público. Se nomes de clientes ou cronogramas forem confidenciais, remova a policy `delta app state public read` e exija login também para leitura antes de divulgar o app.
- A cópia sem custo adicional é manual: em **Definições & Backup**, baixe o JSON completo (máquinas, equipes e PDFs) e envie-o para uma pasta compartilhada do Google Drive. Faça semanalmente e após mudanças grandes; confira o tamanho do arquivo e teste uma restauração de tempos em tempos. Isso não substitui snapshots automáticos do banco, que dependem do plano Supabase.
- Use apenas a Project URL e Publishable Key no navegador. Nunca exponha `service_role` ou uma Secret Key.

## Conectar dispositivos

Em **Project Settings > API Keys**, copie a Project URL e a Publishable Key. No app, abra **Definições**, salve esses valores em cada dispositivo e entre com a conta Supabase Auth. O indicador do cabeçalho mostra somente **Sincronizado** ou **Sem conexão**.
