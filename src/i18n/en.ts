// 中文 → 英文对照。键必须与代码里的中文原文完全一致；{x} 为占位符。
export const en: Record<string, string> = {
  // 设置
  '外观': 'Appearance', '跟随系统': 'System', '浅色': 'Light', '深色': 'Dark', '夜里看不刺眼': 'Easy on the eyes at night',
  '语言': 'Language', '字号': 'Text size', '标准': 'Standard', '大': 'Large', '特大': 'Extra large', '给长辈': 'For grandparents',
  '孕 25 周 3 天 · 像一颗白萝卜': 'Week 25, day 3 · about the size of a daikon',
  '这是正文的样子。手机系统里的"文字大小"设置也会叠加生效。': 'This is body text. Your phone\'s system text size also applies.',
  '这两项只影响这台手机，不会同步给家人。': 'These settings only affect this phone.',
  '外观与字号': 'Appearance & text', '设置': 'Settings', '深色模式给夜里起夜用；字号可以调大给长辈': 'Dark mode for night; larger text for grandparents',

  // 深链接 / 邀请
  '这是你自己家庭的邀请码': 'This is your own family\'s invite code', '把它发给还没加入的家人就行。': 'Share it with family members who haven\'t joined yet.',
  '你已经在一个家庭里了': 'You\'re already in a family', '一部手机只能加入一个家庭。想换家庭，先在「家庭」页清空本机数据。': 'One phone can only be in one family. To switch, clear local data on the Family tab first.',
  '分享邀请二维码': 'Share invite QR code', '分享失败': 'Sharing failed',
  '家人用手机相机扫这个码，或者收到链接后点开，就能加入。': 'Family can scan this code with their camera, or open the link you send them.',
  '加入后能看到什么，由准妈妈决定。': 'What they can see is up to the mom-to-be.',
  '家庭邀请码': 'Family invite code', '已复制': 'Copied', '复制邀请码': 'Copy invite code', '复制': 'Copy',
  '分享邀请链接（微信 / 短信）': 'Share invite link (WeChat / SMS)', '分享二维码图片': 'Share QR image',
  '链接打开是一个网页：已装 App 的人一点就进家庭；没装的人看到邀请码和安装说明。': 'The link opens a web page: people with the app join in one tap; others see the code and install steps.',
  '邀请家人': 'Invite family', '二维码 / 分享': 'QR / Share', '扫码加入': 'Scan to join',
  '把邀请码发给准爸爸和家人，他们在 App 首页选「我有邀请码」加入。': 'Send the code to dad and family. They choose "I have an invite code" on the first screen.',
  '本机模式：可以先添加成员，切换身份体验各角色视角。配置云同步后，家人凭邀请码从自己的手机加入。': 'Local mode: add members here and switch views to preview each role. With cloud sync, family join from their own phones with the code.',
  '{from}邀请你加入「幸运宝贝」，一起记录孕期。\n邀请码：{code}\n点链接加入：{url}': '{from} invited you to LuckyBaby to follow the pregnancy together.\nInvite code: {code}\nJoin here: {url}',
  '邀请码：{code}': 'Invite code: {code}', '点链接加入：{url}': 'Join here: {url}',
  '剪贴板里没有邀请码': 'No invite code in clipboard', '让家人把 6 位邀请码或邀请链接发给你，复制后再点粘贴。': 'Ask your family for the 6-character code or link, copy it, then tap Paste.',
  '粘贴邀请码': 'Paste code', '扫二维码': 'Scan QR', '需要相机权限来扫二维码。也可以回去手动输入 6 位邀请码。': 'Camera access is needed to scan. You can also go back and type the 6-character code.',
  '允许使用相机': 'Allow camera', '对准家人分享的二维码': 'Point at the QR code your family shared',
  '邀请码不对，再核对一下': 'Invite code not found, please check it', '你已经在这个家庭里了': 'You\'re already in this family', '这个家庭已经有准爸爸了，请选"家人"': 'This family already has a dad. Please choose "Family".',
  '匿名登录失败': 'Sign-in failed', '连不上云端': 'Can\'t reach the cloud', '先本机使用': 'Use offline for now', '云同步未配置': 'Cloud sync not configured', '请先在 .env 里填 Supabase 地址和密钥。': 'Add the Supabase URL and key to .env first.', '没能加入': 'Couldn\'t join',

  // 引导
  '幸运宝贝 · 一家人一起记录的孕期': 'LuckyBaby · a pregnancy journal for the whole family', '你好，准妈妈': 'Hello, mom-to-be', '加入她的孕期': 'Join her pregnancy',
  '我是准妈妈': 'I\'m the mom-to-be', '建立家庭': 'Create family', '我有邀请码': 'I have an invite code', '准爸爸 / 家人': 'Dad / family',
  '先由你建立这个家庭。之后用邀请码把准爸爸和家人加进来，他们能看到什么由你决定。': 'You create the family first. Then invite dad and family with a code. You decide what they can see.',
  '你的称呼': 'Your name', '例如：小雨': 'e.g. Xiaoyu', '推算孕周的方式': 'How to calculate your week', '末次月经': 'Last period', '医生给的预产期': 'Due date from doctor',
  '末次月经第一天（YYYY-MM-DD）': 'First day of last period (YYYY-MM-DD)', '预产期（YYYY-MM-DD）': 'Due date (YYYY-MM-DD)', '预产期': 'Due date',
  '宝宝小名（可选）': 'Baby nickname (optional)', '例如：小豆子': 'e.g. Little Bean',
  '让准妈妈把「家庭」页的 6 位邀请码发给你。加入后你看到的内容由她决定。': 'Ask the mom-to-be for the 6-character code on her Family tab. She decides what you can see.',
  '邀请码': 'Invite code', '例如：TY7K2Q': 'e.g. TY7K2Q', '例如：阿强': 'e.g. Tom', '例如：外婆': 'e.g. Grandma', '你是': 'You are',
  '准爸爸': 'Dad-to-be', '能记录、打卡、陪产检': 'Can log, check in, join checkups', '家人': 'Family', '看动态和产检日程': 'See updates and checkup schedule',
  '和准妈妈的关系': 'Relationship to mom', '加入家庭': 'Join family',
  '数据只在你的家庭内可见。不做社区，不做广告，不卖数据。': 'Data is visible only to your family. No community, no ads, no data selling.',
  '数据只存在你的手机里。不做社区，不做广告，不卖数据。': 'Data stays on your phone. No community, no ads, no data selling.',
  '先用示例家庭看看': 'Try a sample family first',
  '老公': 'Husband', '妈妈': 'Mom', '爸爸': 'Dad', '婆婆': 'Mother-in-law', '公公': 'Father-in-law', '姐姐': 'Older sister', '妹妹': 'Younger sister', '哥哥': 'Older brother', '弟弟': 'Younger brother', '闺蜜': 'Best friend',
  '准妈妈': 'Mom-to-be', '角色': 'Role', '称呼': 'Name', '关系': 'Relationship', '添加成员': 'Add member', '添加': 'Add',
  '把邀请码': 'Send the code', '发给家人。当前版本先在本机添加成员，用来体验不同角色看到的内容；云端同步在下一版本开放。': 'to family. In local mode you add members here to preview each role.',

  // 页面标题 / 标签
  '产检': 'Checkups', '记一笔': 'Add entry', '数胎动': 'Kick counter', '宫缩计时': 'Labor timer', '待产包': 'Hospital bag',
  '今': 'T', '检': 'C', '药': 'M', '记': 'L', '家': 'F', '今天': 'Today', '用药': 'Meds', '记录': 'Log', '家庭': 'Family',
  '返回': 'Back', '取消': 'Cancel', '保存': 'Save', '删除': 'Delete', '移除': 'Remove', '开启': 'Turn on', '全部': 'All', '恢复': 'Resume', '开始': 'Start',

  // 宫缩
  '{m}分{s}秒': '{m}m {s}s', '最近一小时 {n} 次，平均持续 {d}，平均间隔 {g}': '{n} in the last hour, avg duration {d}, avg interval {g}', '记录了宫缩：{text}': 'Logged contractions: {text}',
  '感觉肚子发紧发硬时按“开始”，松下来按“结束”。': 'Tap Start when your belly tightens, End when it relaxes.', '规律不规律，App 帮你算，你只管按。': 'The app works out whether they\'re regular. You just tap.',
  '最近 1 小时': 'Last hour', '平均持续': 'Avg duration', '平均间隔': 'Avg interval',
  '已经比较规律了（约每 5 分钟一次、每次约 1 分钟、持续 1 小时）。按医生交代的，可以准备去医院了。': 'They\'re regular now (about every 5 minutes, about 1 minute each, for an hour). Follow your doctor\'s advice and get ready to go in.',
  '一般到"每 5 分钟一次、每次 1 分钟、持续 1 小时"就该去医院；破水或出血不用等，直接去。': 'Usually go to the hospital at "every 5 minutes, 1 minute each, for 1 hour". If your water breaks or you bleed, go right away.',
  '松了就按结束': 'Tap End when it eases', '肚子发紧时按': 'Tap when it tightens', '持续': 'Lasted', '间隔': 'Interval', '宫缩': 'Contraction',

  // 胎动
  '用时 {m} 分钟': '{m} min', '数了胎动 {n} 次（{m} 分钟）': 'Counted {n} kicks ({m} min)', '宝宝动一下就按一下。连续的一串动算一次。': 'Tap once per movement. A burst of movements counts as one.',
  '早、中、晚各数 1 小时，每小时 3 次以上通常是正常的。': 'Count for 1 hour morning, noon and night. 3 or more per hour is usually normal.',
  '动了，按一下': 'Moved? Tap', '按这里开始': 'Tap to start', '屏幕会保持常亮 · 满 60 分钟自动保存': 'Screen stays on · saves automatically at 60 min', '放弃这次': 'Discard',
  '大按钮，一只手按': 'Big button, one hand', '28 周起每天三次': '3 times a day from week 28', '一按开始一按结束': 'Tap to start, tap to end', '规律了会告诉你': 'Tells you when they\'re regular',

  // 待产包
  '证件': 'Documents', '宝宝': 'Baby', '建议孕 34 周前备齐。勾一下代表准备好了，会显示是谁准备的。': 'Best packed by week 34. Tick an item when it\'s ready; it shows who packed it.',
  '已备好': 'packed', '加一项': 'Add an item', '例如：束腹带': 'e.g. belly band', '清单按常见医院要求整理，以你产检医院的通知为准。': 'Based on common hospital lists. Follow your own hospital\'s instructions.', '全家一起准备': 'Pack together',
  '双方身份证': 'Both parents\' ID', '母子健康手册、产检病历': 'Maternity record book, checkup records', '医保卡 / 生育保险材料': 'Insurance card / maternity insurance papers', '准生证 / 生育登记': 'Birth registration',
  '产褥垫、一次性内裤': 'Maternity pads, disposable underwear', '哺乳文胸、防溢乳垫': 'Nursing bras, breast pads', '出院衣服、拖鞋、袜子': 'Going-home clothes, slippers, socks', '洗漱用品、毛巾': 'Toiletries, towels',
  '吸管杯、巧克力 / 红牛': 'Straw cup, chocolate / energy drink', '手机充电线、长充电线': 'Phone charger, long cable', 'NB 码纸尿裤': 'Newborn diapers', '连体衣 2–3 套、包被': '2–3 onesies, swaddle blanket',
  '奶瓶、少量奶粉（备用）': 'Bottle, a little formula (backup)', '湿巾、纱布巾、棉柔巾': 'Wipes, muslin cloths, cotton tissues', '出院用的安全提篮 / 抱被': 'Car seat / carrier for going home',

  // 产检详情
  '，记录了 ': ', logged ', ' 项数值': ' values', '孕 {w} 周': 'Week {w}', '孕 {w} 周开始': 'From week {w}', '{w} 周起': 'Week {w}+', '已完成': 'Done', '未定': 'TBD', '日期': 'Date', '医院': 'Hospital', '例如：协和': 'e.g. City Hospital',
  '注意': 'Note', '检查项目': 'Tests', '一行一项': 'One per line', '带什么': 'What to bring', '再加一样…': 'Add another…', '开了提醒的话，前一天晚上 8 点会把没勾的念一遍。': 'With reminders on, unticked items are read out at 8 pm the night before.',
  '报告照片': 'Report photos', '拍照': 'Camera', '相册': 'Library', '把报告单拍下来放在这里，复诊时医生要看上次的，一翻就有。': 'Photograph your reports here so they\'re at hand when the doctor asks for last time\'s.',
  '删除这张照片？': 'Delete this photo?', '正在传到云端…': 'Uploading…', '家人也能看到；长按可删除。': 'Family can see these. Long-press to delete.', '照片只存在本机；长按可删除。': 'Stored on this phone only. Long-press to delete.',
  '没有权限': 'No permission', '需要相机权限来拍报告单。': 'Camera access is needed to photograph reports.', '需要相册权限来选照片。': 'Photo library access is needed to pick photos.',
  '有照片没传到云端': 'Some photos didn\'t upload', '已先存在这台手机上，家人暂时看不到。网络好了再加一次即可。': 'They\'re kept on this phone for now, so family can\'t see them yet. Add them again when you\'re back online.',
  '谁陪同': 'Who\'s coming along', '先去「家庭」邀请准爸爸或家人。': 'Invite dad or family from the Family tab first.', '陪同': 'coming along', '还没有人说要陪': 'No one has offered yet', '我陪': 'I\'ll come', '{name} 要陪「{title}」': '{name} will come to "{title}"',
  '数值': 'Values', '参考': 'Ref.', '高于参考': 'Above range', '低于参考': 'Below range', '参考范围只是常见区间，超出不等于有问题，下次产检问问医生就好。': 'Ranges are typical values. Being outside them doesn\'t mean a problem. Just ask your doctor next time.',
  '结果与备注': 'Results & notes', '例如：一切正常，医生说下次 4 周后来': 'e.g. All normal, next visit in 4 weeks', '检查数值和结果只对准妈妈和准爸爸可见。': 'Values and results are visible to mom and dad only.',
  '谁能看到': 'Who can see this', '仅自己': 'Only me', '伴侣': 'Partner', '全家': 'Whole family', '标记完成并保存': 'Mark done & save', '仅保存': 'Save only', '改回未完成': 'Mark as not done', '删除这次产检': 'Delete this checkup', '点任意处关闭': 'Tap anywhere to close',
  '自定义产检': 'Custom checkup', '周': 'wk', '未安排日期': 'No date yet', '本周': 'This week', '已过窗口': 'Window passed',
  '按常规产检节点自动排入，点开可改日期、医院、记录数值。医院之间流程略有差异，以医生安排为准。': 'Scheduled from standard checkup milestones. Tap to change date, hospital, or log values. Hospitals vary; follow your doctor.',
  '添加一次产检': 'Add a checkup', '已完成 {n} 次': '{n} completed', '接下来的产检': 'Upcoming checkups', '近期没有安排的产检。': 'No checkups scheduled soon.',

  // 首页
  '还好': 'Okay', '吐了': 'Threw up', '累瘫': 'Exhausted', '不舒服': 'Unwell', '今天{mood}': 'Today: {mood}', '今天怎么样？点一下就行': 'How are you today? Just tap',
  '没有拿到通知权限': 'Notifications not allowed', '可以在系统设置里给「幸运宝贝」打开通知，再回来开启。': 'Enable notifications for LuckyBaby in Settings, then come back.',
  '你好，{name}': 'Hi, {name}', '{mom} 的孕期 · 你是{role}': '{mom}\'s pregnancy · you\'re {role}', '孕 {w} 周 {d} 天': 'Week {w}, day {d}', '孕早期': '1st trimester', '孕中期': '2nd trimester', '孕晚期': '3rd trimester',
  '距预产期 {n} 天': '{n} days to due date', '让手机提醒，不用记': 'Let your phone remind you', '产检前一晚说要不要空腹、带什么；补充剂到点提醒。': 'The night before a checkup: fasting or not, what to bring. Supplements on time.',
  '本周的{nick}': '{nick} this week', '像一颗{like}': 'About the size of a {like}', '今天要吃': 'Today\'s supplements', '本周没有需要吃的补充剂。': 'No supplements this week.', '今天 ': 'Today ',
  '你也可以替她打卡，动态里会显示是你记的。': 'You can check in for her. The feed shows it was you.', '家里的动态': 'Family feed',

  // 家庭
  '同步中…': 'Syncing…', '网络不通': 'no network', '已同步 · 点此刷新': 'Synced · tap to refresh', '成员': 'Members', '（我）': '(me)',
  '记录了 {a} 条 · 打卡 {b} 次': '{a} entries · {b} check-ins', '陪了 {a} 次产检 · 替她打卡 {b} 次': 'Joined {a} checkups · checked in for her {b} times', '看得到孕周、动态和产检日程': 'Can see the week, feed and checkup schedule',
  '以TA的视角看': 'View as them', '可见：动态、产检、数值、用药': 'Sees: feed, checkups, values, meds', '可见：孕周、动态、产检日程': 'Sees: week, feed, checkup schedule', '移除成员': 'Remove member',
  '只影响这台手机': 'This phone only', '移出家庭': 'Remove from family', '移出': 'Remove', '确定把 {name} 移出家庭？TA 将看不到任何记录，之后可凭邀请码重新加入。': 'Remove {name} from the family? They will no longer see any records. They can rejoin with the invite code.', '你已被移出这个家庭': 'You have been removed from this family', '本机的记录已清空。如果是误操作，可以凭邀请码重新加入。': 'Local records were cleared. If this was a mistake, you can rejoin with the invite code.',
  '{name} 加入了家庭': '{name} joined the family', '{name} 创建了家庭，预产期 {date}': '{name} created the family · due {date}',
  '已移出的成员': 'Removed member', '暂时没同步上（{err}），会自动重试 · 点此立即重试': 'Not synced yet ({err}). Retrying automatically · tap to retry now',
  '动态': 'Feed', '今天感觉怎么样…': 'How do you feel today…', '给她说句话…': 'Say something to her…', '清空数据': 'Clear data', '删除本机全部记录并重新开始？': 'Delete all records on this phone and start over?', '清空': 'Clear', '清空本机数据': 'Clear local data',
  '系统': 'System', '赞': 'Like', '留言': 'Comment', '说点什么…': 'Say something…', '还没有动态。记一笔产检、吃药或心情，家人就能看到。': 'No updates yet. Log a checkup, a supplement or a mood and family will see it.', '补充剂': 'supplement',
  '上传失败：': 'Upload failed: ', '下载失败：': 'Download failed: ',

  // 记录
  '记两次以上体重后会画出曲线。': 'Log weight twice or more to see the curve.', '体重': 'Weight', '症状': 'Symptom', '心情': 'Mood', '胎动': 'Kicks', '随手记': 'Note', '还没记录': 'Nothing yet',
  '孕期推荐增重 11.5–16 kg': 'Recommended gain 11.5–16 kg', '最近记录': 'Recent entries', '还没有记录。体重、症状、心情、胎动都可以记。': 'No entries yet. Weight, symptoms, mood and kicks all go here.', '次': 'times',
  'kg，建议每周同一时间称': 'kg, best weighed at the same time each week', '孕吐、水肿、腰酸、失眠…': 'Nausea, swelling, back pain, insomnia…', '今天感觉怎么样': 'How do you feel today', '28 周起，早中晚各数 1 小时': 'From week 28, 1 hour morning, noon and night', '想说的话、想留下的瞬间': 'Anything you want to say or keep',
  '孕吐': 'Nausea', '嗜睡': 'Sleepy', '水肿': 'Swelling', '腰酸': 'Back pain', '失眠': 'Insomnia', '便秘': 'Constipation', '胃灼热': 'Heartburn', '头晕': 'Dizzy', '抽筋': 'Cramps', '尿频': 'Frequent peeing',
  '很好': 'Great', '平静': 'Calm', '有点累': 'A bit tired', '焦虑': 'Anxious', '烦躁': 'Irritable', '感动': 'Touched',
  '记录体重 {v} kg': 'Weight {v} kg', '数了胎动 {v} 次': 'Counted {v} kicks', '今天：{t}': 'Today: {t}', '心情：{t}': 'Mood: {t}', '体重（kg）': 'Weight (kg)', '次数': 'Count', '内容': 'Text', '补充说明': 'Details', '备注（可选）': 'Note (optional)',

  // 用药
  '按医嘱': 'As prescribed', '预置了常见补充剂与推荐孕周，剂量以医嘱为准。准爸爸也可以替她打卡。': 'Common supplements with typical weeks are preset. Follow your doctor for doses. Dad can check in for her too.',
  '最近 7 天': 'Last 7 days', '妈妈记的': 'by mom', '爸爸记的': 'by dad', '正在吃': 'Taking now', '每天 {t}': 'Daily at {t}', '之后要吃': 'Coming up', '已停': 'Stopped', '名称': 'Name', '例如：地屈孕酮': 'e.g. Dydrogesterone', '剂量': 'Dose', '例如：10 mg': 'e.g. 10 mg', '每天几点': 'Time of day', '添加药物或补充剂': 'Add medicine or supplement',
  '叶酸': 'Folic acid', '孕前 3 个月至孕 12 周；高危孕妇按医嘱': '3 months before to week 12; as prescribed if high-risk', '钙': 'Calcium', '孕中期起；与铁剂错开 2 小时': 'From 2nd trimester; 2 hours apart from iron', '铁': 'Iron', '饭后服，少喝茶和咖啡；可能引起便秘': 'After meals, less tea and coffee; may cause constipation', '随餐服用': 'With meals', '维生素 D': 'Vitamin D',

  // 提醒
  '记得空腹。': 'Remember to fast. ', '带上：': 'Bring: ', '看看要带什么': 'Check what to bring', '出门前检查：': 'Before you leave: ', '祝顺利': 'Good luck', '问问她吃了没，或者你替她记一下': 'Ask if she took it, or check in for her', '该吃{name}了': 'Time for {name}',

  // 产检模板
  '早孕确认': 'Early pregnancy confirmation', 'B 超确认宫内孕、胎心': 'Ultrasound to confirm pregnancy and heartbeat', '血 HCG / 孕酮': 'Blood HCG / progesterone', 'B 超可能需憋尿': 'Ultrasound may need a full bladder',
  '建档': 'Registration', '空腹抽血（血常规、血型、肝肾功能、传染病）': 'Fasting blood tests (CBC, blood type, liver/kidney, infections)', '尿常规': 'Urinalysis', '心电图': 'ECG', '腹部彩超': 'Abdominal ultrasound', '空腹。带双方身份证、母子健康手册、早期 B 超单': 'Fasting. Bring both IDs, maternity record book, early ultrasound report',
  'NT 检查': 'NT scan', 'NT 超声（颈项透明层）': 'Nuchal translucency ultrasound', '不需空腹、不需憋尿。NT < 2.5–3 mm 为正常': 'No fasting, no full bladder. NT < 2.5–3 mm is normal',
  '唐筛 / 无创 DNA': 'Down screening / NIPT', '唐氏筛查抽血 或 无创 DNA': 'Down syndrome blood screening or NIPT', '唐筛需空腹；无创不需': 'Fasting for screening; not for NIPT',
  '常规产检': 'Routine checkup', '血压': 'Blood pressure', '宫高腹围': 'Fundal height & abdominal girth', '胎心': 'Fetal heartbeat',
  '大排畸': 'Anomaly scan', '系统超声（四维/三维）': 'Detailed ultrasound (3D/4D)', '不需空腹。吃饱、适当活动，让宝宝动起来。可能需要多次': 'No fasting. Eat well and move around so baby is active. May take several tries',
  '糖耐（OGTT）': 'Glucose test (OGTT)', '空腹血糖': 'Fasting glucose', '喝糖水后 1 小时血糖': 'Glucose 1 hour after drink', '2 小时血糖': 'Glucose at 2 hours', '前一晚 22:00 后禁食禁水；5 分钟内喝完糖水；参考 5.1 / 10.0 / 8.5 mmol/L': 'Nothing to eat or drink after 10 pm; finish the drink within 5 min; reference 5.1 / 10.0 / 8.5 mmol/L',
  '血常规、尿常规': 'CBC, urinalysis', '常规产检 + B 超': 'Routine checkup + ultrasound', 'B 超（胎位、羊水、胎盘）': 'Ultrasound (position, fluid, placenta)', '血压体重': 'Blood pressure & weight',
  '胎心监护 + B 族链球菌': 'NST + Group B strep', '胎心监护（NST）': 'Non-stress test (NST)', 'GBS 筛查': 'GBS screening', '血常规': 'CBC', '36 周起每周一次': 'Weekly from week 36', '胎心监护': 'NST',
  '胎心监护 + B 超估重': 'NST + weight estimate', 'B 超估重、羊水': 'Ultrasound weight estimate, fluid', '足月产检': 'Full-term checkup', '评估分娩方式': 'Delivery planning', '准备待产包': 'Pack the hospital bag',
  '收缩压': 'Systolic', '舒张压': 'Diastolic', '按孕周增重': 'by week', '宫高': 'Fundal height', '≈ 孕周 ± 3': '≈ week ± 3', '腹围': 'Abdominal girth', '胎心率': 'Fetal heart rate', '次/分': 'bpm', '血红蛋白': 'Hemoglobin',
  '病历本（大白本）': 'Medical record book', '母子健康手册 / 电子条码': 'Maternity record book / e-code', '医保卡 / 就诊码': 'Insurance card / patient code', '早餐（抽完血就吃）': 'Breakfast (for after the blood draw)', '一瓶水（到了再喝）': 'A bottle of water (drink on arrival)',

  // 宝宝大小
  '罂粟籽': 'poppy seed', '胚胎刚着床，开始形成胎盘。': 'Just implanted; the placenta is forming.', '芝麻': 'sesame seed', '心脏开始搏动的前奏。': 'Getting ready for the first heartbeat.', '扁豆': 'lentil', 'B 超可能已经看到胎心。': 'Ultrasound may already show a heartbeat.',
  '蓝莓': 'blueberry', '手脚的雏形长出来了。': 'Tiny hands and feet are budding.', '树莓': 'raspberry', '手指脚趾开始分开。': 'Fingers and toes are separating.', '樱桃': 'cherry', '尾巴消失，开始像个小人。': 'The tail is gone; starting to look like a little person.',
  '金桔': 'kumquat', '所有重要器官都开始工作。': 'All major organs are working.', '无花果': 'fig', '会踢腿伸展了，只是你还感觉不到。': 'Kicking and stretching, though you can\'t feel it yet.', '青柠': 'lime', 'NT 检查的窗口期。': 'Window for the NT scan.',
  '豌豆荚': 'pea pod', '进入孕中期，孕吐通常会减轻。': 'Second trimester; nausea usually eases.', '柠檬': 'lemon', '能做表情了。': 'Can make facial expressions.', '苹果': 'apple', '开始长胎毛。': 'Fine hair is growing.',
  '牛油果': 'avocado', '可能感受到第一次胎动。': 'You may feel the first kicks.', '梨': 'pear', '开始有脂肪，骨骼变硬。': 'Building fat; bones are hardening.', '红薯': 'sweet potato', '能听到外面的声音，爸爸可以说话了。': 'Can hear sounds now. Dad, say hello.',
  '芒果': 'mango', '皮肤上覆盖胎脂。': 'Skin is coated in vernix.', '香蕉': 'banana', '孕期过半。': 'Halfway there.', '胡萝卜': 'carrot', '开始吞咽羊水，练习消化。': 'Swallowing fluid to practice digesting.',
  '木瓜': 'papaya', '大排畸的窗口期。': 'Window for the anomaly scan.', '葡萄柚': 'grapefruit', '眼睛快速发育。': 'Eyes are developing fast.', '玉米': 'ear of corn', '肺部开始产生表面活性物质。': 'Lungs start making surfactant.',
  '白萝卜': 'daikon', '开始有睡眠和清醒的节律。': 'Sleep and wake cycles are starting.', '大葱': 'leek', '眼睛可以睁开了。': 'Eyes can open.', '花椰菜': 'cauliflower', '进入孕晚期。': 'Third trimester begins.',
  '茄子': 'eggplant', '开始数胎动。': 'Time to start counting kicks.', '南瓜': 'squash', '骨骼继续变硬。': 'Bones keep hardening.', '卷心菜': 'cabbage', '开始转成头位。': 'Turning head-down.',
  '椰子': 'coconut', '五感都在工作。': 'All five senses are working.', '大白菜': 'napa cabbage', 'B 超看胎位和羊水。': 'Ultrasound checks position and fluid.', '菠萝': 'pineapple', '免疫系统在发育。': 'Immune system is developing.',
  '哈密瓜': 'cantaloupe', '指甲长到指尖。': 'Nails reach the fingertips.', '蜜瓜': 'honeydew', '每周胎心监护开始。': 'Weekly NST begins.', '生菜': 'head of lettuce', '入盆前后。': 'Dropping into the pelvis.',
  '冬瓜': 'winter melon', '足月了，随时可能发动。': 'Full term; could arrive any time.', '韭葱': 'leek', '准备好待产包。': 'Have the hospital bag ready.', '小西瓜': 'small watermelon', '静静等待。': 'Quietly waiting.', '西瓜': 'watermelon', '预产期到了。': 'Due date is here.',
};
