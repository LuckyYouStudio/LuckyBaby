# 云同步（Supabase）接入

## 当前状态（2026-09-05）

- 项目：`luckybaby`，ref `wpjmmgqqdyycmxlnnkfd`，区域东京（ap-northeast-1）。Dashboard：https://supabase.com/dashboard/project/wpjmmgqqdyycmxlnnkfd
- schema.sql 已执行；匿名登录已开启（config.toml → `supabase config push`）。
- 本机 `.env` 已填 URL / anon key / 数据库密码（不入库）。换机器时从 Dashboard → Project Settings → API 重新复制。
- 已实测：建家庭 → 邀请码加入 → 打卡与陪产检实时同步到对方。
- 账号下另有一个注册时自动生成的默认项目（美国东部），未使用，可在 Dashboard 删除。
- 后续改 schema：改完 `schema.sql` 后执行 `supabase db query --linked --file supabase/schema.sql`（注意脚本非幂等，建表语句重复执行会报错，可只执行改动片段）。

## M2 已接入（2026-09-05）

- **报告照片云同步**：私有桶 `reports`，路径 `<family_id>/<checkup_id>/<uuid>.jpg`，按家庭成员 RLS；App 端显示走 1 小时签名链接。
- **伴侣提醒**：Edge Function `nudge-partner` + pg_cron 每 30 分钟；她到点 2 小时没记补充剂，就给准爸爸发 Expo 推送，`nudges` 表去重。
  - 远程推送生效条件：App 有 EAS projectId（`app.json extra.eas.projectId`，需 Expo 账号 `eas init`）+ Apple 开发者账号（推送权限）。**目前两者都没有**，所以云端任务会跑但 `push_tokens` 为空，不会发。
  - 过渡方案已生效：准爸爸手机上的本地提醒（她到点 2 小时未记，且他的 App 已同步到这一状态）。
  - 改函数后重新部署：`supabase functions deploy nudge-partner --no-verify-jwt`；secret 用 `supabase secrets set CRON_SECRET=...`，并同步更新 cron.job 里的 header。
- 家庭时区 `families.tz` 由建家庭的手机上报。
- **邀请落地页** Edge Function `join`：`/functions/v1/join?code=XXXXXX&from=名字`，纯 HTML，无需登录；二维码和分享链接都指向它。已装 App 的人点“打开 App 加入”走 `luckybaby://join?code=`。上架后填 `APP_STORE_URL` 重新部署：`supabase functions deploy join --no-verify-jwt`。

## 一次性准备（需要你的 Supabase 账号）

1. 登录 CLI（会打开浏览器）：
   ```bash
   supabase login
   ```
2. 之后由 Claude 或你自己执行：
   ```bash
   # 建项目（组织 id 用 `supabase orgs list` 查看；区域建议 ap-southeast-1 新加坡或 ap-northeast-1 东京）
   supabase projects create luckybaby --org-id <ORG_ID> --region ap-northeast-1 --db-password '<强密码>'
   # 关联并推 schema
   supabase link --project-ref <PROJECT_REF>
   supabase db push            # 或：supabase db query --file supabase/schema.sql
   ```
3. 开启匿名登录（家人不用注册账号）：Dashboard → Authentication → Sign In / Providers → Anonymous sign-ins → 打开。
   或用管理 API：
   ```bash
   curl -X PATCH "https://api.supabase.com/v1/projects/<PROJECT_REF>/config/auth" \
     -H "Authorization: Bearer $(cat ~/.supabase/access-token)" -H "Content-Type: application/json" \
     -d '{"external_anonymous_users_enabled": true}'
   ```
4. 把 Dashboard → Project Settings → API 里的 URL 和 anon key 填到项目根目录 `.env`（参考 `.env.example`），重启 `npx expo start`。

## 不用 CLI 的做法

Dashboard 新建项目 → SQL Editor 粘贴执行 `schema.sql` → 开匿名登录 → 复制 URL / anon key 到 `.env`。

## 工作方式

- App 仍是本地优先：所有操作先写本地，再把差异推到云端；家人改动通过 Realtime 推回来合并。
- 准妈妈建家庭走 `create_family()`，家人凭 6 位邀请码走 `join_family()`；换设备时 `my_family()` 取回。
- 行级安全（RLS）按角色过滤：mom 全可见；dad 看 partner/family；family 只看 family。产检表对所有成员可读，数值由客户端按角色隐藏；如需服务端硬隔离，下一步拆视图。
