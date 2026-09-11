// 删除账号：先用调用者身份清数据（RPC delete_my_data），再删 Storage 里的报告照片，最后用 service role 删除 auth 用户。
// 苹果 5.1.1(v) 要求删除账号必须把用户数据真正删干净，所以照片不能留在存储桶里。
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'reports';

/** 报告照片路径是 <family_id>/<checkup_id>/<uuid>.jpg，Storage 的 list 不递归，所以要逐层列。 */
async function removeFamilyPhotos(admin: ReturnType<typeof createClient>, familyId: string) {
  const paths: string[] = [];
  const { data: dirs } = await admin.storage.from(BUCKET).list(familyId, { limit: 1000 });
  for (const dir of dirs ?? []) {
    const { data: files } = await admin.storage.from(BUCKET).list(`${familyId}/${dir.name}`, { limit: 1000 });
    for (const f of files ?? []) paths.push(`${familyId}/${dir.name}/${f.name}`);
  }
  if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  return paths.length;
}

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return new Response('unauthorized', { status: 401 });
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: userData, error: uerr } = await userClient.auth.getUser();
  if (uerr || !userData.user) return new Response('unauthorized', { status: 401 });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // 先记下这个人作为准妈妈拥有的家庭：删库时它们会被级联删除，之后就查不到了，
  // 但存储桶里的照片不会跟着走，得靠这份名单去清。
  const { data: owned } = await admin.from('members').select('family_id').eq('user_id', userData.user.id).eq('role', 'mom');
  const ownedFamilies = (owned ?? []).map((r: { family_id: string }) => r.family_id);

  const { error: derr } = await userClient.rpc('delete_my_data');
  if (derr) return Response.json({ error: derr.message }, { status: 400 });

  // 照片清理失败不该挡住账号删除，记日志继续。
  let photos = 0;
  for (const fid of ownedFamilies) {
    try { photos += await removeFamilyPhotos(admin, fid); }
    catch (e) { console.error('storage cleanup failed for family', fid, e); }
  }

  const { error: aerr } = await admin.auth.admin.deleteUser(userData.user.id);
  if (aerr) return Response.json({ error: aerr.message }, { status: 500 });
  return Response.json({ ok: true, families_deleted: ownedFamilies.length, photos_deleted: photos });
});
