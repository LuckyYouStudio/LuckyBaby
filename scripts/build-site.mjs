// 从 Edge Function 的文案生成 GitHub Pages 静态站点（site/）。
// 为什么不直接用 Edge Function：Supabase 的 functions 域名会把 text/html 强制改成
// text/plain + nosniff（防钓鱼），浏览器只会显示 HTML 源码。隐私政策和邀请落地页
// 必须能正常渲染，所以放到 GitHub Pages，内容仍以 supabase/functions 里的文案为准。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const legal = readFileSync('supabase/functions/legal/index.ts', 'utf8');
const join = readFileSync('supabase/functions/join/index.ts', 'utf8');

const grab = (src, name) => {
  const m = src.match(new RegExp('const ' + name + ' = `([\\s\\S]*?)`;\\n'));
  if (!m) throw new Error('not found: ' + name);
  if (m[1].includes('${')) throw new Error('unexpected interpolation in ' + name);
  return m[1];
};

const css = grab(legal, 'css');
const docs = {
  privacy: { zh: grab(legal, 'privacyZh'), en: grab(legal, 'privacyEn'), titleZh: '幸运宝贝 隐私政策', titleEn: 'LuckyBaby Privacy Policy' },
  terms: { zh: grab(legal, 'termsZh'), en: grab(legal, 'termsEn'), titleZh: '幸运宝贝 用户协议', titleEn: 'LuckyBaby Terms of Use' },
};

// 文案里指向另一份文档的相对链接 ?doc=xxx&lang=yy → 静态文件名
const fixLinks = (s) => s.replace(/\?doc=(privacy|terms)&lang=(zh|en)/g, (_, d, l) => `${d}.html?lang=${l}`);

const page = (key, d) => `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${d.titleZh} / ${d.titleEn}</title>
<style>${css}
.langbar{display:flex;gap:8px;justify-content:flex-end;margin-bottom:8px}
.langbar a{font-size:13px;text-decoration:none;border:1px solid #D5D9D1;border-radius:14px;padding:4px 12px;color:#4B5750}
.langbar a.on{background:#2E5E4E;border-color:#2E5E4E;color:#fff}
</style></head><body><div class="wrap">
<div class="langbar"><a href="?lang=zh" id="lz">中文</a><a href="?lang=en" id="le">English</a></div>
<div id="zh">${fixLinks(d.zh)}</div>
<div id="en" hidden>${fixLinks(d.en)}</div>
<p><small>幸运宝贝 LuckyBaby · LuckyYou Studio · 更新于 2026-09-09 · <a href="mailto:liushuang19920505@gmail.com">liushuang19920505@gmail.com</a></small></p>
</div>
<script>
(function(){
  var q=new URLSearchParams(location.search).get('lang');
  var lang=(q==='en'||q==='zh')?q:((navigator.language||'zh').toLowerCase().indexOf('zh')===0?'zh':'en');
  document.getElementById('zh').hidden=lang!=='zh';
  document.getElementById('en').hidden=lang!=='en';
  document.documentElement.lang=lang==='en'?'en':'zh-CN';
  document.getElementById(lang==='en'?'le':'lz').className='on';
})();
</script></body></html>`;

mkdirSync('site', { recursive: true });
for (const [key, d] of Object.entries(docs)) writeFileSync(`site/${key}.html`, page(key, d));

// ---- 邀请落地页：把 Edge Function 的模板改成读 query string 的纯静态版
const joinCss = join.match(/<style>\n([\s\S]*?)\n<\/style>/)[1];
const logo = join.match(/(<svg width="44"[\s\S]*?<\/svg>)/)[1];
const strings = (name) => {
  const m = join.match(new RegExp('const ' + name + ' = \\{([\\s\\S]*?)\\n\\};'));
  return m[1];
};
const pick = (block, key) => block.match(new RegExp(key + ": '((?:[^'\\\\]|\\\\.)*)'"))[1].replace(/\\'/g, "'");
const steps = (block) => [...block.match(/steps: \[([\s\S]*?)\]/)[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
const ZH = strings('ZH'), EN = strings('EN');
const T = {
  zh: { title: '幸运宝贝 · 邀请你加入', intro: pick(ZH, 'intro'), copy: pick(ZH, 'copy'), open: pick(ZH, 'open'), beta: pick(ZH, 'beta'), copied: pick(ZH, 'copied'), steps: steps(ZH), invited: (m) => (m ? m + ' 邀请你' : '邀请你') + '一起记录孕期' },
  en: { title: "LuckyBaby · You're invited", intro: pick(EN, 'intro'), copy: pick(EN, 'copy'), open: pick(EN, 'open'), beta: pick(EN, 'beta'), copied: pick(EN, 'copied'), steps: steps(EN), invited: (m) => (m ? `${m} invited you` : "You're invited") + ' to follow the pregnancy together' },
};

writeFileSync('site/join.html', `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>幸运宝贝 · 邀请你加入</title>
<style>${joinCss}</style></head><body><div class="wrap">
<div class="logo">${logo}</div>
<h1 id="h"></h1><p id="intro"></p>
<div class="code" id="code"></div>
<a class="btn ghost" href="#" id="copy" onclick="cp();return false"></a>
<a class="btn primary" id="open" href="#"></a>
<p class="tip" id="beta"></p>
<ol class="tip" id="steps"></ol>
<script>
var T=${JSON.stringify({ zh: { ...T.zh, invited: undefined }, en: { ...T.en, invited: undefined } })};
var p=new URLSearchParams(location.search);
var code=(p.get('code')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
var from=(p.get('from')||'').slice(0,20);
var q=p.get('lang');
var lang=(q==='en'||q==='zh')?q:((navigator.language||'zh').toLowerCase().indexOf('zh')===0?'zh':'en');
var L=T[lang];
document.documentElement.lang=lang==='en'?'en':'zh-CN';
document.title=lang==='en'?"LuckyBaby · You're invited":'幸运宝贝 · 邀请你加入';
document.getElementById('h').textContent=lang==='en'?((from?from+' invited you':"You're invited")+' to follow the pregnancy together'):((from?from+' 邀请你':'邀请你')+'一起记录孕期');
document.getElementById('intro').textContent=L.intro;
document.getElementById('code').textContent=code||'——';
document.getElementById('copy').textContent=L.copy;
document.getElementById('open').textContent=L.open;
document.getElementById('open').href='luckybaby://join?code='+code;
document.getElementById('beta').textContent=L.beta;
document.getElementById('steps').innerHTML=L.steps.map(function(s){return '<li>'+s+'</li>'}).join('');
function cp(){navigator.clipboard&&navigator.clipboard.writeText(code).then(function(){document.getElementById('copy').textContent=L.copied})}
window.cp=cp;
</script>
</div></body></html>`);

writeFileSync('site/index.html', `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>幸运宝贝 LuckyBaby</title><style>${css}</style></head><body><div class="wrap">
<h1>幸运宝贝 LuckyBaby</h1>
<p>一家人一起记录的孕期 App。准妈妈记录，准爸爸参与，家人了解。不做社区、不做广告、不卖数据。</p>
<p><a href="privacy.html">隐私政策 / Privacy Policy</a><br><a href="terms.html">用户协议 / Terms of Use</a></p>
<p><small>联系 · Contact: <a href="mailto:liushuang19920505@gmail.com">liushuang19920505@gmail.com</a></small></p>
</div></body></html>`);

writeFileSync('site/.nojekyll', '');
console.log('site/ written: index.html privacy.html terms.html join.html');
