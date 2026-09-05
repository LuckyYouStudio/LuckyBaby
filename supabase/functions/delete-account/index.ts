// 删除账号：先用调用者身份清数据（RPC delete_my_data），再用 service role 删除 auth 用户。
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return new Response('unauthorized', { status: 401 });
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: userData, error: uerr } = await userClient.auth.getUser();
  if (uerr || !userData.user) return new Response('unauthorized', { status: 401 });
  const { error: derr } = await userClient.rpc('delete_my_data');
  if (derr) return Response.json({ error: derr.message }, { status: 400 });
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: aerr } = await admin.auth.admin.deleteUser(userData.user.id);
  if (aerr) return Response.json({ error: aerr.message }, { status: 500 });
  return Response.json({ ok: true });
});
