# 幸运宝贝（LuckyBaby）

一家人一起记录的孕期 App。准妈妈记录，准爸爸参与，家人了解。不做社区、不做电商、不做广告、不做诊断。

## 文档
- docs/01-市场调研.md：市场、竞品、用户痛点、来源
- docs/02-产品方案.md：定位、角色权限、功能、商业模式、技术方案、里程碑
- supabase/schema.sql：M1 云同步数据模型与 RLS（尚未接入）

## 技术栈
Expo SDK 57 + React Native 0.86 + TypeScript + expo-router（文件路由）。本地数据用 AsyncStorage（`src/store/store.tsx` 的 reducer 持久化），无后端。

## 运行
```bash
npm install
npx expo start          # 然后按 i 开 iOS 模拟器（Expo Go），或按 w 开浏览器
```
- 开发调试：打开 `/demo?as=m1|d1|f1` 会载入示例家庭（孕 25 周），并以准妈妈/准爸爸/家人身份进入。
- 引导页底部"先用示例家庭看看"同样载入示例数据。

## 结构
- `app/`：路由。`(tabs)/` 五个页签：今天 index、产检 checkups、用药 meds、记录 life、家庭 family；`checkup/[id]` 产检详情；`log/new` 记一笔；`member/new` 添加成员；`demo` 示例数据。
- `src/data/`：类型、产检模板（中国常规节点）、补充剂模板、每周宝宝大小。
- `src/store/`：全局 reducer + 持久化 + 派生数据（`useDerived` 含孕周与可见性判断）。
- `src/components/ui.tsx`：通用组件；`src/theme.ts`：颜色与字号。

## 约定
- 角色可见性：mom 全可见；dad 看 partner/family；family 只看 family（产检日程例外：家人可看标题/日期，不看数值和结果）。
- 每条记录的 `visibility` 由准妈妈决定；默认产检/用药为 partner，动态为 family。
- 医学内容只做"记录 + 参考区间提示"，文案不下诊断结论。
- 视觉：米白纸张感 + 深松绿 + 杏色；每个角色一个颜色（mom 松绿、dad 杏色、family 灰蓝）。

## 已知
- `expo start` 用 CI=1 会禁用热更新。
- 本机 xcode-select 未指向 Xcode.app 时，Claude 的模拟器面板无法附加；Expo Go 仍可运行。
