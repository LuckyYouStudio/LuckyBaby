// 伴侣提醒：每 30 分钟由 pg_cron 调用。她到点 2 小时还没记补充剂，就给准爸爸发一条推送。
// 需要：push_tokens 里有准爸爸的 Expo push token（App 端登记，需 EAS projectId + Apple 开发者账号）。
import { createClient } from 'npm:@supabase/supabase-js@2';

function nowInTz(tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function weekOf(dueDate: string, today: string) {
  const lmp = new Date(dueDate + 'T00:00:00Z').getTime() - 280 * 86400000;
  return Math.floor((new Date(today + 'T00:00:00Z').getTime() - lmp) / 86400000 / 7);
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: tokens } = await sb.from('push_tokens').select('member_id, family_id, token, members!inner(role)').eq('members.role', 'dad');
  const sent: string[] = [];
  for (const t of tokens ?? []) {
    const { data: fam } = await sb.from('families').select('due_date, mom_name, tz').eq('id', t.family_id).single();
    if (!fam) continue;
    const { date, minutes } = nowInTz(fam.tz || 'Asia/Shanghai');
    const week = weekOf(fam.due_date, date);
    const { data: sups } = await sb.from('supplements').select('id, name, time_of_day, week_from, week_to').eq('family_id', t.family_id).eq('active', true).lte('week_from', week).gte('week_to', week);
    for (const s of sups ?? []) {
      const [hh, mm] = (s.time_of_day || '08:00').split(':').map(Number);
      if (minutes < hh * 60 + mm + 120) continue; // 还没到 2 小时
      const { count: logged } = await sb.from('supplement_logs').select('id', { count: 'exact', head: true }).eq('supplement_id', s.id).eq('date', date);
      if (logged) continue;
      const { error: dup } = await sb.from('nudges').insert({ family_id: t.family_id, supplement_id: s.id, date });
      if (dup) continue; // 今天已提醒过
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: t.token, title: `${fam.mom_name}今天的${s.name}还没记`, body: '问问她吃了没，或者你替她记一下', data: { supplementId: s.id, nudge: true }, sound: 'default' }),
      });
      sent.push(`${t.family_id}:${s.name}`);
    }
  }
  return Response.json({ sent });
});
