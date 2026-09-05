// 邀请落地页：微信/短信里点开链接看到的页面。
// 已装 App：按钮唤起 luckybaby://join?code=XXX 直接进家庭；没装：提示安装并把邀请码复制好。
const APP_STORE_URL = ''; // 上架后填 App Store 链接
const SCHEME = 'luckybaby://join?code=';

const EN = {
  title: 'LuckyBaby · You\'re invited', invited: (m: string) => (m ? `${m} invited you` : 'You\'re invited') + ' to follow the pregnancy together',
  intro: 'LuckyBaby is a pregnancy journal shared by the whole family: checkups, supplements, moods. No community, no ads.',
  copy: 'Copy invite code', open: 'Installed? Open the app to join', download: 'Not installed? Download',
  beta: 'The app is in private testing and not in the App Store yet. Ask the person who invited you to install it, then choose "I have an invite code" and enter the 6-character code above.',
  steps: ['Open LuckyBaby', 'Choose "I have an invite code"', 'Type or paste the code and pick your role'], copied: 'Copied',
};
const ZH = {
  title: '幸运宝贝 · 邀请你加入', invited: (m: string) => (m ? m + ' 邀请你' : '邀请你') + '一起记录孕期',
  intro: '「幸运宝贝」是一家人共用的孕期记录本：产检、吃药、心情，家人都能看到、一起参与。不做社区，不做广告。',
  copy: '复制邀请码', open: '已安装，打开 App 加入', download: '还没安装，去下载',
  beta: 'App 正在内测，还没上架。请让邀请你的人帮你安装，装好后在首页选「我有邀请码」，输入上面的 6 位码。',
  steps: ['打开幸运宝贝', '首页选「我有邀请码」', '输入或粘贴邀请码，选你的身份'], copied: '已复制',
};

const html = (code: string, mom: string, L: typeof ZH, lang: string) => `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${L.title}</title>
<style>
body{margin:0;background:#F5F6F2;color:#1F2A24;font-family:-apple-system,"PingFang SC","Noto Sans SC",sans-serif;line-height:1.6}
.wrap{max-width:420px;margin:0 auto;padding:40px 24px 60px}
.logo{width:72px;height:72px;border-radius:18px;background:#2E5E4E;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
h1{font-size:24px;margin:0 0 6px}
p{margin:0 0 14px;color:#4B5750}
.code{font-size:40px;letter-spacing:8px;font-weight:700;color:#2E5E4E;background:#DDE8E1;border-radius:12px;padding:16px;text-align:center;margin:20px 0 8px;font-variant-numeric:tabular-nums}
.btn{display:block;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;margin-top:12px;font-size:17px}
.primary{background:#2E5E4E;color:#fff}.ghost{border:1px solid #2E5E4E;color:#2E5E4E}
.tip{font-size:13px;color:#7C877F;margin-top:24px}
ol{padding-left:20px;color:#4B5750}
</style></head><body><div class="wrap">
<div class="logo"><svg width="44" height="44" viewBox="0 0 100 100"><circle cx="50" cy="52" r="34" fill="#FBE4D2"/><path d="M50 18c-2 6 0 10 6 12" stroke="#244C3F" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M34 50q6-8 12 0M54 50q6-8 12 0" stroke="#3A2F2A" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M45 64q5 5 10 0" stroke="#3A2F2A" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="30" cy="58" r="5" fill="#F2A88E" opacity=".8"/><circle cx="70" cy="58" r="5" fill="#F2A88E" opacity=".8"/></svg></div>
<h1>${L.invited(mom)}</h1>
<p>${L.intro}</p>
<div class="code" id="code">${code}</div>
<a class="btn ghost" href="#" onclick="copy();return false" id="copy">${L.copy}</a>
<a class="btn primary" href="${SCHEME}${code}">${L.open}</a>
${APP_STORE_URL ? `<a class="btn ghost" href="${APP_STORE_URL}" onclick="copy()">${L.download}</a>` : `<p class="tip">${L.beta}</p>`}
<ol class="tip">${L.steps.map((x) => `<li>${x}</li>`).join('')}</ol>
<script>
function copy(){navigator.clipboard&&navigator.clipboard.writeText('${code}').then(function(){document.getElementById('copy').textContent='${L.copied}'})}
</script>
</div></body></html>`;

Deno.serve((req) => {
  const u = new URL(req.url);
  const code = (u.searchParams.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const mom = (u.searchParams.get('from') || '').slice(0, 20);
  if (!code) return new Response('missing code', { status: 400 });
  const q = u.searchParams.get('lang');
  const accept = req.headers.get('accept-language') || '';
  const lang = q === 'en' || q === 'zh' ? q : accept.toLowerCase().startsWith('zh') ? 'zh' : accept ? 'en' : 'zh';
  return new Response(html(code, mom, lang === 'en' ? EN : ZH, lang === 'en' ? 'en' : 'zh-CN'), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', Vary: 'Accept-Language' } });
});
