// 邀请落地页：微信/短信里点开链接看到的页面。
// 已装 App：按钮唤起 luckybaby://join?code=XXX 直接进家庭；没装：提示安装并把邀请码复制好。
const APP_STORE_URL = ''; // 上架后填 App Store 链接
const SCHEME = 'luckybaby://join?code=';

const html = (code: string, mom: string) => `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>幸运宝贝 · 邀请你加入</title>
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
<h1>${mom ? mom + ' 邀请你' : '邀请你'}一起记录孕期</h1>
<p>「幸运宝贝」是一家人共用的孕期记录本：产检、吃药、心情，家人都能看到、一起参与。不做社区，不做广告。</p>
<div class="code" id="code">${code}</div>
<a class="btn ghost" href="#" onclick="copy();return false" id="copy">复制邀请码</a>
<a class="btn primary" href="${SCHEME}${code}">已安装，打开 App 加入</a>
${APP_STORE_URL ? `<a class="btn ghost" href="${APP_STORE_URL}" onclick="copy()">还没安装，去下载</a>` : `<p class="tip">App 正在内测，还没上架。请让邀请你的人帮你安装，装好后在首页选「我有邀请码」，输入上面的 6 位码。</p>`}
<ol class="tip"><li>打开幸运宝贝</li><li>首页选「我有邀请码」</li><li>输入或粘贴邀请码，选你的身份</li></ol>
<script>
function copy(){navigator.clipboard&&navigator.clipboard.writeText('${code}').then(function(){document.getElementById('copy').textContent='已复制'})}
</script>
</div></body></html>`;

Deno.serve((req) => {
  const u = new URL(req.url);
  const code = (u.searchParams.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const mom = (u.searchParams.get('from') || '').slice(0, 20);
  if (!code) return new Response('missing code', { status: 400 });
  return new Response(html(code, mom), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
});
