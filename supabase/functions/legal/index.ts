// 隐私政策 / 用户协议 页面：/functions/v1/legal?doc=privacy|terms&lang=zh|en
const css = `body{margin:0;background:#F5F6F2;color:#1F2A24;font-family:-apple-system,"PingFang SC","Noto Sans SC",sans-serif;line-height:1.7}.wrap{max-width:720px;margin:0 auto;padding:40px 24px 80px}h1{font-size:26px}h2{font-size:18px;margin-top:28px}p,li{color:#2F3A34}small{color:#7C877F}a{color:#2E5E4E}`;
const wrap = (title: string, body: string, lang: string) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body><div class="wrap">${body}<p><small>幸运宝贝 LuckyBaby · LuckyYou Studio · 更新于 2026-09-05</small></p></div></body></html>`;

const privacyZh = `<h1>幸运宝贝 隐私政策</h1>
<p>幸运宝贝（LuckyBaby）是一款供家庭共同记录孕期的应用。我们的原则很简单：<strong>数据属于你的家庭，不做广告，不做社区，不出售、不共享给任何第三方用于营销。</strong></p>
<h2>1. 我们收集什么</h2>
<ul>
<li><strong>你主动记录的内容</strong>：产检日期与结果、体重、症状、心情、胎动、宫缩、用药与补充剂打卡、报告照片、待产包清单、家庭动态与留言。其中产检结果、体重、症状等属于<strong>健康信息（敏感个人信息）</strong>，我们仅在你首次使用并单独同意后处理。</li>
<li><strong>账号信息</strong>：默认使用匿名账号；你可选择通过 Apple 登录或邮箱绑定，此时我们保存 Apple 提供的用户标识或你的邮箱地址，用于换机恢复。</li>
<li><strong>设备信息</strong>：推送令牌（用于提醒）、语言与时区（用于按当地时间提醒）、错误日志（仅包含错误文本，不含记录内容）。</li>
<li>我们<strong>不收集</strong>手机号、通讯录、位置、设备唯一标识，不接入任何第三方广告或统计 SDK。</li>
</ul>
<h2>2. 数据怎么用</h2>
<p>只用于向你和你邀请的家庭成员展示记录、发送提醒、同步与恢复数据。准妈妈决定每条记录对伴侣和家人的可见范围。</p>
<h2>3. 数据存在哪里</h2>
<p>数据加密传输后存储在 Supabase 提供的云数据库（当前位于日本东京区域），照片存储在私有存储桶，仅家庭成员可通过时效链接访问。我们通过数据库行级权限确保只有本家庭成员能读取本家庭数据。</p>
<h2>4. 谁能看到</h2>
<p>只有你的家庭成员（按准妈妈设定的可见范围）。开发者不会查看你的记录内容，除非你为排查问题主动提供。</p>
<h2>5. 你的权利</h2>
<ul>
<li>随时在 App 内查看、修改、删除任何记录。</li>
<li>准妈妈可随时移出家庭成员。</li>
<li>在「家庭」页可<strong>删除账号</strong>：准妈妈删除账号会删除整个家庭的云端数据；其他成员删除账号会退出家庭并删除自己的登录信息。删除不可恢复。</li>
<li>可联系我们索取数据副本或提出其他请求：<a href="mailto:liushuang19920505@gmail.com">liushuang19920505@gmail.com</a>。</li>
</ul>
<h2>6. 未成年人</h2>
<p>本应用面向成年人。我们不会主动收集未成年人信息。</p>
<h2>7. 医疗声明</h2>
<p>幸运宝贝不是医疗器械，不提供诊断或治疗建议。参考范围仅供了解，一切以医生判断为准。</p>
<h2>8. 变更</h2>
<p>政策更新会在 App 内提示。继续使用视为接受更新后的政策。</p>`;

const privacyEn = `<h1>LuckyBaby Privacy Policy</h1>
<p>LuckyBaby is a pregnancy journal shared by a family. Our principle is simple: <strong>your data belongs to your family. No ads, no community, and we never sell or share it with third parties for marketing.</strong></p>
<h2>1. What we collect</h2>
<ul>
<li><strong>What you record</strong>: checkup dates and results, weight, symptoms, mood, kicks, contractions, medication and supplement check-ins, report photos, hospital bag list, family feed and comments. Checkup results, weight and symptoms are <strong>health data (sensitive personal information)</strong> and are processed only after your separate consent on first use.</li>
<li><strong>Account</strong>: anonymous by default. If you link with Apple or email we store the Apple user identifier or your email address so you can restore on a new phone.</li>
<li><strong>Device</strong>: push token (reminders), language and time zone (local-time reminders), error logs (error text only, never your records).</li>
<li>We <strong>do not</strong> collect phone numbers, contacts, location or device identifiers, and we use no third-party advertising or analytics SDKs.</li>
</ul>
<h2>2. How we use it</h2>
<p>Only to show records to you and the family members you invite, send reminders, and sync or restore your data. The mom-to-be decides what her partner and family can see.</p>
<h2>3. Where it lives</h2>
<p>Data is encrypted in transit and stored in a Supabase cloud database (currently Tokyo, Japan). Photos live in a private bucket reachable only by family members via expiring links. Row-level permissions ensure only your family can read your family's data.</p>
<h2>4. Who can see it</h2>
<p>Only your family members, within the visibility the mom-to-be sets. The developers do not look at your records unless you share them to troubleshoot.</p>
<h2>5. Your rights</h2>
<ul>
<li>View, edit or delete any record in the app at any time.</li>
<li>The mom-to-be can remove members at any time.</li>
<li><strong>Delete account</strong> on the Family tab: the mom-to-be's deletion removes the whole family's cloud data; other members leave the family and delete their sign-in. Deletion is permanent.</li>
<li>Contact us for a data copy or other requests: <a href="mailto:liushuang19920505@gmail.com">liushuang19920505@gmail.com</a>.</li>
</ul>
<h2>6. Children</h2>
<p>The app is for adults. We do not knowingly collect data from children.</p>
<h2>7. Medical disclaimer</h2>
<p>LuckyBaby is not a medical device and does not diagnose or treat. Reference ranges are for general understanding only; always follow your doctor.</p>
<h2>8. Changes</h2>
<p>Updates are announced in the app. Continued use means you accept the updated policy.</p>`;

const termsZh = `<h1>幸运宝贝 用户协议</h1>
<h2>1. 服务内容</h2><p>幸运宝贝提供孕期记录、家庭共享与提醒功能。当前为免费内测版本，功能可能调整。</p>
<h2>2. 你的责任</h2><p>请如实记录并妥善保管邀请码，邀请码可让他人加入你的家庭并查看你允许的内容。请勿上传违法或侵犯他人权利的内容。</p>
<h2>3. 医疗声明</h2><p>本应用不构成医疗建议。产检时间表、参考范围、营养补充说明均为一般性信息，具体以医生指导为准。出现紧急情况请立即就医。</p>
<h2>4. 数据与隐私</h2><p>见<a href="?doc=privacy&lang=zh">隐私政策</a>。</p>
<h2>5. 免责</h2><p>在法律允许范围内，我们不对因使用或无法使用本应用造成的损失承担责任。请定期确认云端同步正常。</p>
<h2>6. 终止</h2><p>你可随时删除账号。我们可在违反本协议时终止服务。</p>
<h2>7. 联系</h2><p><a href="mailto:liushuang19920505@gmail.com">liushuang19920505@gmail.com</a></p>`;

const termsEn = `<h1>LuckyBaby Terms of Use</h1>
<h2>1. The service</h2><p>LuckyBaby provides pregnancy journaling, family sharing and reminders. It is currently a free beta and features may change.</p>
<h2>2. Your responsibilities</h2><p>Keep your invite code safe: it lets others join your family and see what you allow. Do not upload unlawful content or content that infringes others' rights.</p>
<h2>3. Medical disclaimer</h2><p>The app is not medical advice. Checkup schedules, reference ranges and supplement notes are general information; follow your doctor. In an emergency, seek care immediately.</p>
<h2>4. Data and privacy</h2><p>See the <a href="?doc=privacy&lang=en">Privacy Policy</a>.</p>
<h2>5. Liability</h2><p>To the extent permitted by law, we are not liable for losses arising from use of or inability to use the app. Please check that cloud sync is working regularly.</p>
<h2>6. Termination</h2><p>You may delete your account at any time. We may terminate service for breaches of these terms.</p>
<h2>7. Contact</h2><p><a href="mailto:liushuang19920505@gmail.com">liushuang19920505@gmail.com</a></p>`;

Deno.serve((req) => {
  const u = new URL(req.url);
  const doc = u.searchParams.get('doc') === 'terms' ? 'terms' : 'privacy';
  const q = u.searchParams.get('lang');
  const accept = (req.headers.get('accept-language') || '').toLowerCase();
  const lang = q === 'en' || q === 'zh' ? q : accept.startsWith('zh') || !accept ? 'zh' : 'en';
  const body = doc === 'terms' ? (lang === 'en' ? termsEn : termsZh) : (lang === 'en' ? privacyEn : privacyZh);
  const title = doc === 'terms' ? (lang === 'en' ? 'LuckyBaby Terms' : '幸运宝贝 用户协议') : (lang === 'en' ? 'LuckyBaby Privacy' : '幸运宝贝 隐私政策');
  return new Response(wrap(title, body, lang === 'en' ? 'en' : 'zh-CN'), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=600', Vary: 'Accept-Language' } });
});
