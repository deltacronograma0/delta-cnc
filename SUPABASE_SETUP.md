# Supabase e segurança

O app usa `delta_app_state` para máquinas e equipes, Supabase Auth para autenticação e `delta_user_roles` para autorizar editores e administradores. Senhas não são armazenadas no estado do app, nos backups ou no navegador.

## Migração existente

1. Confirme que está no projeto Supabase correto.
2. Execute [SUPABASE_AUTH_MIGRATION.sql](SUPABASE_AUTH_MIGRATION.sql) no SQL Editor como owner.
3. O script copia e-mails/perfis das tabelas existentes, remove `pass` de `delta_users`, remove a coluna de usuários de `delta_app_state`, bloqueia o acesso às tabelas legadas e limita escrita aos perfis autenticados. Máquinas, equipes e dados operacionais são preservados.
4. Em **Authentication > URL Configuration**, defina o Site URL como `https://deltacronograma0.github.io/delta-cnc/` e adicione essa URL à lista de Redirect URLs.
5. Convide as quatro contas migradas em **Authentication > Users > Invite user**. Cada pessoa deve definir uma senha nova pelo convite. Não reutilize as senhas antigas.
6. Confirme que os quatro e-mails aparecem em `public.delta_user_roles` com seus perfis. A migração importa essa lista automaticamente. Para criar uma conta nova, convide-a no Supabase Auth e insira o e-mail e perfil na tabela por SQL; não crie senhas pelo app.

## Segurança e dados

- Desative **Anonymous Sign-Ins** em **Authentication > Providers**. Visitantes continuam com leitura pública do cronograma; apenas usuários autenticados com perfil Editor ou Administrador podem escrever.
- `delta_user_roles` só permite ao usuário consultar o próprio perfil; o administrador pode consultar a lista. Mudanças de perfil devem ser feitas por um owner do projeto no SQL Editor.
- O bucket `delta-pdfs` permanece privado. Apenas perfis autenticados podem obter ou enviar PDFs.
- `delta_app_state` continua legível sem login para exibir o cronograma público. Se nomes de clientes ou cronogramas forem confidenciais, remova a policy `delta app state public read` e exija login também para leitura antes de divulgar o app.
- Configure backups automáticos no plano disponível e teste uma restauração periódica. Guarde uma cópia JSON exportada fora do dispositivo que opera o app.
- Use apenas a Project URL e Publishable Key no navegador. Nunca exponha `service_role` ou uma Secret Key.

## Conectar dispositivos

Em **Project Settings > API Keys**, copie a Project URL e a Publishable Key. No app, abra **Definições**, salve esses valores em cada dispositivo e entre com a conta Supabase Auth. O indicador do cabeçalho mostra somente **Sincronizado** ou **Sem conexão**.
