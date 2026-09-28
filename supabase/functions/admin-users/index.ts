import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://deltacronograma0.github.io',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const primaryAdminEmail = 'deltacronograma@gmail.com';
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find(user => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  throw new Error('A lista de contas excede o limite de consulta.');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return jsonResponse({ error: 'Autenticação necessária.' }, 401);
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'A função não está configurada no servidor.' }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const token = authorization.replace(/^Bearer\s+/i, '');
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user?.email || authData.user.is_anonymous) {
    return jsonResponse({ error: 'Autenticação necessária.' }, 401);
  }

  const actorEmail = authData.user.email.toLowerCase();
  const { data: actorRole, error: actorRoleError } = await adminClient
    .from('delta_user_roles')
    .select('role')
    .eq('email', actorEmail)
    .maybeSingle();
  if (actorRoleError || actorRole?.role !== 'Administrador') {
    return jsonResponse({ error: 'Apenas administradores podem gerir acessos de Editores.' }, 403);
  }
  const isPrimaryAdmin = actorEmail === primaryAdminEmail;

  let body: { action?: string; email?: string; password?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Corpo JSON inválido.' }, 400);
  }

  const action = body.action;
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Informe um endereço de e-mail válido.' }, 400);
  }

  if (action === 'upsert') {
    const password = String(body.password || '');
    const role = body.role;
    if (password.length < 12 || new TextEncoder().encode(password).length > 72) {
      return jsonResponse({ error: 'A senha temporária deve ter entre 12 e 72 bytes.' }, 400);
    }
    if (role !== 'Editor' && role !== 'Administrador') {
      return jsonResponse({ error: 'Perfil inválido.' }, 400);
    }
    if (email === primaryAdminEmail && role !== 'Administrador') {
      return jsonResponse({ error: 'O administrador principal não pode perder o perfil de Administrador.' }, 400);
    }

    const { data: existingRole, error: existingRoleError } = await adminClient
      .from('delta_user_roles')
      .select('role')
      .eq('email', email)
      .maybeSingle();
    if (existingRoleError) return jsonResponse({ error: existingRoleError.message }, 500);
    if (!isPrimaryAdmin && (role !== 'Editor' || existingRole?.role === 'Administrador')) {
      return jsonResponse({ error: 'Somente o Administrador principal pode gerir contas Administrador.' }, 403);
    }

    const existingUser = await findAuthUserByEmail(adminClient, email);
    let userId = existingUser?.id;
    let createdUser = false;
    if (existingUser) {
      const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true
      });
      if (error) return jsonResponse({ error: error.message }, 400);
    } else {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      if (error || !data.user) return jsonResponse({ error: error?.message || 'Não foi possível criar a conta.' }, 400);
      userId = data.user.id;
      createdUser = true;
    }

    const { error: roleError } = await adminClient
      .from('delta_user_roles')
      .upsert({ email, role }, { onConflict: 'email' });
    if (roleError) {
      if (createdUser && userId) await adminClient.auth.admin.deleteUser(userId);
      return jsonResponse({ error: roleError.message }, 500);
    }
    return jsonResponse({ email, role, updated: Boolean(existingUser) });
  }

  if (action === 'delete') {
    if (email === primaryAdminEmail) {
      return jsonResponse({ error: 'O administrador principal não pode ser excluído.' }, 400);
    }
    if (email === actorEmail) {
      return jsonResponse({ error: 'Não é possível excluir a própria conta durante a sessão.' }, 400);
    }

    const { data: targetRole, error: targetRoleError } = await adminClient
      .from('delta_user_roles')
      .select('role')
      .eq('email', email)
      .maybeSingle();
    if (targetRoleError) return jsonResponse({ error: targetRoleError.message }, 500);
    if (!targetRole) return jsonResponse({ error: 'Conta não encontrada.' }, 404);
    if (!isPrimaryAdmin && targetRole.role !== 'Editor') {
      return jsonResponse({ error: 'Administradores só podem excluir contas Editor.' }, 403);
    }

    if (targetRole.role === 'Administrador') {
      const { count, error } = await adminClient
        .from('delta_user_roles')
        .select('email', { count: 'exact', head: true })
        .eq('role', 'Administrador');
      if (error) return jsonResponse({ error: error.message }, 500);
      if ((count || 0) <= 1) return jsonResponse({ error: 'O último administrador não pode ser excluído.' }, 400);
    }

    const authUser = await findAuthUserByEmail(adminClient, email);
    if (authUser) {
      const { error } = await adminClient.auth.admin.deleteUser(authUser.id);
      if (error) return jsonResponse({ error: error.message }, 500);
    }
    const { error } = await adminClient.from('delta_user_roles').delete().eq('email', email);
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ email, deleted: true });
  }

  return jsonResponse({ error: 'Ação inválida.' }, 400);
});
