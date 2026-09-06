# 幸运宝贝（LuckyBaby）

一家人一起记录的孕期 App。准妈妈记录，准爸爸参与，家人了解。不做社区、不做电商、不做广告、不做诊断。

## 文档
- docs/01-市场调研.md：市场、竞品、用户痛点、来源
- docs/02-产品方案.md：定位、角色权限、功能、商业模式、技术方案、里程碑
- docs/03-孕妇痛点与体验优化.md：孕妇痛点调研与对应改动
- docs/05-备孕模块.md：备孕（经期/排卵期/同房时机）的算法、权限与界面
- supabase/schema.sql：数据模型、RLS、RPC、Storage、推送表（已接入，见 supabase/README.md）
- supabase/functions/nudge-partner：伴侣提醒 Edge Function（pg_cron 每 30 分钟）

## 技术栈
Expo SDK 57 + React Native 0.86 + TypeScript + expo-router（文件路由）。本地优先：AsyncStorage 持久化 reducer（`src/store/store.tsx`）；云同步用 Supabase（`src/lib/supabase.ts`、`src/store/sync.ts`），差异推送 + Realtime 拉取合并。没有 `.env` 时以纯本地模式运行。接入状态见 supabase/README.md。

## 运行
```bash
npm install
npm run ios             # 编译原生 iOS App 装到模拟器（需 Xcode + CocoaPods；首次约 10 分钟）
npx expo start          # 只起 Metro（原生 App 已装好时用这个；按 w 可开浏览器调试）
npm run ios:device      # 装到数据线连着的 iPhone（Release 包，独立运行；付费团队签名）
```
- 真机安装：Xcode 需登录 Apple ID（app.json `ios.appleTeamId` 是该账号的个人团队）；脚本会自动去掉 aps-environment（个人团队没有推送权限）并用 `-allowProvisioningUpdates` 生成描述文件。
- `ios/`、`android/` 由 `npx expo prebuild` 生成，已 gitignore；改了 app.json 或图标要重新 prebuild。
- 图标由 `assets/*.png` 生成（松绿圆 + 白"幸"），源脚本是一段 Swift（AppKit 画图），需要时重画。
- 开发调试：打开 `/demo?as=m1|d1|f1` 会载入示例家庭（孕 25 周），并以准妈妈/准爸爸/家人身份进入。
- 引导页底部"先用示例家庭看看"同样载入示例数据。

## 结构
- `app/`：路由。`(tabs)/` 五个页签：今天 index、产检 checkups、用药 meds、记录 life、家庭 family；`checkup/[id]` 产检详情；`log/new` 记一笔；`member/new` 添加成员；`demo` 示例数据。
- `src/data/`：类型、产检模板（中国常规节点）、补充剂模板、每周宝宝大小。
- `src/store/`：全局 reducer + 持久化 + 派生数据（`useDerived` 含孕周与可见性判断）。
- `src/components/ui.tsx`：通用组件；`src/theme.ts`：颜色与字号。`colors` 是可变对象，`applyTheme()` 在根布局按设置/系统切换深浅色，`fontScale` 控制字号；样式必须在渲染时读 `colors.x`，不要在模块顶层缓存。
- `src/lib/reminders.ts` 本地提醒（产检/补充剂/准爸爸的“她还没记”）；`src/lib/photos.ts` 报告照片上传与签名链接；`src/lib/push.ts` 推送 token 登记。
- 其他页面：`kicks` 数胎动、`contractions` 宫缩计时、`packing` 待产包、`settings` 外观与字号、`invite` 邀请二维码/分享、`scan` 扫码加入、`join` 深链接 `luckybaby://join?code=`、`cycle` 备孕日历。
- 备孕：`pregnancy.stage` 为 `ttc` 时首页渲染 `src/components/TtcHome.tsx`；估算逻辑在 `src/lib/cycle.ts`（纯函数）；记录存 `state.cycleLogs`，云端表 `cycle_logs`，只有 mom/dad 可见。「我怀孕了」走 reducer `becomePregnant`。家庭信息（阶段/预产期/周期）随同步下发，比较时用 `canonPregnancy()`。
- 邀请落地页：Edge Function `join`（`src/lib/invite.ts` 里的 INVITE_BASE）；上架后把函数里 APP_STORE_URL 填上并重新部署。

## 国际化
- `src/i18n/index.ts` 的 `tr('中文原文', {占位})`：中文原文即键，英文在 `src/i18n/en.ts`；没有对照返回原文。**新增任何界面文字都要用 tr() 包起来并补 en.ts**。
- 语言：设置页“语言”（跟随系统 / 中文 / English），默认按设备语言（expo-localization）。根布局 `setLang()` 后靠 store 重渲染生效，所以 **含 tr() 的常量不能放在模块顶层**（改成函数，如 `KINDS()`）。
- 内置数据（产检模板、补充剂、宝宝大小、待产包、参考值）存中文，显示时 `tr(x)`；用户输入原样显示。
- 日期文案在 `src/lib/pregnancy.ts` 按语言分支；邀请落地页按 `lang` 参数 / Accept-Language。
- 检查遗漏：提取所有 tr('…') 键与 en.ts 对比（见 git 历史里的脚本思路）。

## 约定
- 角色可见性：mom 全可见；dad 看 partner/family；family 只看 family（产检日程例外：家人可看标题/日期，不看数值和结果）。
- 每条记录的 `visibility` 由准妈妈决定；默认产检/用药为 partner，动态为 family。
- 医学内容只做"记录 + 参考区间提示"，文案不下诊断结论。
- 视觉：米白纸张感 + 深松绿 + 杏色；每个角色一个颜色（mom 松绿、dad 杏色、family 灰蓝）。

## 已知
- `expo start` 用 CI=1 会禁用热更新。
- Web 端 `Alert` 是空实现，弹窗统一用 `src/lib/alert.ts`。
- RLS 里被策略调用的函数（my_role/can_see）必须 SECURITY DEFINER，否则 members 表策略递归。
- 云同步 e2e 测试：浏览器开 localhost 与 127.0.0.1 两个来源即两个匿名用户。
