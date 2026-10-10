# 街拍摄影赛事聚合站

街头摄影赛事的索引站。把征稿的日期、地点、费用、权利条款标签和获奖廊地址收在一起，点进去仍然回到官网。单件作品只存最长边不超过 400 像素的索引缩略图，点击直接去源站作品页，不提供高清。

当前是 **M0 骨架**：schema、手工 YAML、列表 / 详情、以及还不会真正抓取的 CI 占位。采集适配器和死链探测都还没做。列表筛选和 `/calendar.ics` 已经接上。

代码的真源是这份 **Cursor Origin** 仓库，不是 Airtable，也不是数据库。当前线上路径是 **Cloudflare Workers**（不要再用 Pages 上的 `@cloudflare/next-on-pages`）。也可以另接到 Vercel，见下文。

## 本地运行

需要 Node.js 22。

```bash
npm i
npm run dev
```

开发服务器在 [http://127.0.0.1:3847](http://127.0.0.1:3847)。

其他命令：

| 命令 | 作用 |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run validate-data` | 用 Zod 校验 `data/contests`，并抽查几条不该通过的数据 |
| `npm run build` | `next build`。坏掉的 YAML 会让构建失败。CI 用这条 |
| `npm run cf:build` | `opennextjs-cloudflare build`（内部会再跑 `npm run build`，再打成 Worker） |
| `npm run preview` | 构建后用 Wrangler 在本地 Workers 运行时预览 |
| `npm run deploy` | 构建并部署到 Cloudflare。需要本机已登录 Wrangler，仓库里没有密钥 |
| `npm run start` | 跑 Next 构建产物，同样是 3847 端口 |

## 数据

真源是 `data/contests/*.yaml`，一个文件一场赛事。加载器在 `src/lib/contest-files.ts`，schema 在 `src/lib/contest-schema.ts`。页面通过 `src/lib/contests.ts` 读取，构建时写进静态页。

请把日期写成**带时区**的 ISO 8601，并加上引号，例如 `"2026-06-30T23:59:00+08:00"`。加载器用 YAML 1.2 core schema，避免日期被解析成 `Date`。

`data/contests/` 里是 20 条人工种子（Caution 标成 `health: warn`，Magnum 为 `archived`，纪实大项下的街拍类别标成 `adjacent`）。部分日期按往年节奏估算，权利标签仍为空，表示尚未评估。

### 字段

| 字段 | 含义 |
| --- | --- |
| `id`, `slug` | 小写字母、数字、连字符。`slug` 出现在 `/contests/[slug]` |
| `name` | 展示名称 |
| `official_url` | 官网，http(s) |
| `status` | `draft` / `published` / `archived` |
| `open_at`, `deadline_at`, `announce_at` | 带时区的时间，或 `null`。截止必须晚于开放 |
| `edition` | 届次，或 `null` |
| `geo` | `{ label, country?, city? }`，或 `null` |
| `online` | 是否含线上。纯线下时 `geo` 必填 |
| `fee` | `free` / `paid` / `mixed` / `unknown` |
| `street_photo_relevance` | `core` / `adjacent` / `unreviewed`（人工初标） |
| `rights_tags` | `transfer_copyright`、`exclusive`、`no_payment`、`moral_rights_waived`。空数组表示**未评估**，不是“安全” |
| `gallery_urls` | `{ url, label?, edition? }`。整届获奖列表的外链 |
| `gallery_works` | 单件作品索引。`source_page_url` 必填，且必须是这一件作品的页面，不能是获奖列表或原图文件。`thumb_path` 是 `public/` 下的 `thumbs/{id}/…`，最长边 ≤ 400。可选 `title`、`author_name`、`author_homepage_url`。`source_site_label` 必填。流水线见 [TECH.md](TECH.md) |
| `source_adapters` | `{ id, kind? }`。`kind` 为 `manual` / `jsonld` / `html` / `api`，缺省 `manual`。M0 不会执行它们 |
| `last_fetched_at`, `content_hash` | 抓取后才填。现在保持 `null` |
| `health` | `ok` / `warn` / `dead`。M0 只展示，不探测 |

未知字段会被 `.strict()` 拒绝，避免手写 YAML 时把名字写错还以为存进去了。

列表页的主筛选是开放窗口、费用和地区，写在地址栏的查询参数里（`window`、`fee`、`region`，加上辅助的 `status`、`relevance`）。「开放中」只包含填写了截止时间且尚未过这次构建时刻的赛事；截止时间为空的归入「日期未定」。地区里「含线上」看 `online`，国家按 `geo.country` 归到中国、欧洲、美洲、大洋洲或其他。详情页按 slug 读取同一份数据。

`/calendar.ics` 略过三个日期都空的赛事，名单写在关于页。已归档、或没有截止时间但仍有其他日期的条目，会在事件说明里注明。

## Cloudflare Workers

适配器是 `@opennextjs/cloudflare`（`1.20.10`），不是 `@cloudflare/next-on-pages`。Wrangler 固定在 `4.149.0`，`@cloudflare/workers-types` 固定在 `5.20261010.1`，避免 `npm ci` 时 workers-types 4 和 Wrangler 4 的 peer 冲突。

`prebuild`（`npm run build` 之前）和 `npm run cf:build` 都会把 YAML 写成 `src/generated/contests.json` 和 `public/calendar.ics`。页面和 Worker 读这份快照，请求时不再读磁盘。Cache Components 和 partial prefetch 已关掉：Next 16.4 会在 Worker 里加载 `preview-props.json`，而 `@opennextjs/cloudflare@1.20.10` 还没把它打进包（上游 PR 1356）。`postinstall` 会给这个版本补上 `preview-props` 的 glob，装到已包含它的版本时自动跳过。`open-next.config.ts` 用默认的 dummy cache，**不需要 R2**。`wrangler.jsonc` 里的 Worker 名字是 `alane`，`WORKER_SELF_REFERENCE` 必须和这个名字一致。

不要在现有的 **Pages** 项目上只改构建命令再 Redeploy。`@opennextjs/cloudflare` 产出的是 Worker（`.open-next/worker.js` 和 `.open-next/assets`），经典 Pages 只认静态输出目录，接不上。

在 Cloudflare 里用 **Workers Builds**（Workers & Pages 里新建 Worker，连 GitHub `watsonkin/ALane` 的 `main`）。先改设置，再重新部署：

| 设置 | 值 |
| --- | --- |
| Build command | `npm run cf:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| 输出目录 | 不填。不要设 Pages 的 Output directory |
| Node.js | `22` |
| Root directory | 仓库根目录 |

非生产分支的预览命令可以用 `npx opennextjs-cloudflare upload`。M0 没有密钥，不要在构建里打印 token。本地预览需要把 `.dev.vars.example` 复制成 `.dev.vars`（只有 `NEXTJS_ENV=development`）。这个文件已忽略，不要提交，Wrangler 部署也不会带上它。

## 把 Origin 仓库接到 Vercel

这份工程从 Cursor 的空白项目长出来，Origin 是 git 托管，Vercel 是网站托管。两边要连上，推送才能变成站点。起步说明见 [cursor.com/codebase/get-started](https://cursor.com/codebase/get-started)。

1. 先给仓库起名并发布到 Origin。在 Agent 输入框上方选择 **Create repo**（或对话里的 Create repo），用字母、数字、连字符或下划线，最长 100 个字符。团队里可以选择 Private 或 Internal。发布后到 [cursor.com/codebase](https://cursor.com/codebase) 能看到它。codebase 的名字会变成地址里的 `{owner}`：`https://cursor.com/codebase/{owner}/{repo}`。名字还没定时，不要把别人的 owner 或仓库地址写进配置。
2. **Origin ↔ Vercel**：在 codebase 的 Apps 里安装 Vercel（[Origin Apps 文档](https://cursor.com/docs/origin/apps)，设置页在 [cursor.com/codebase/settings/apps](https://cursor.com/codebase/settings/apps)），再到这个仓库自己的 Apps 标签确认它已连上。连上之后，推送可以触发部署，pull request 可以有预览环境，合并进默认分支后可以进生产。
3. 另一条路：仓库已经存在时，在 Agents 窗口连上 Vercel 账号，点输入框上方的 **Publish**。如果还没有 Vercel 插件，Cursor 会先让你 Add Vercel。Agent 会把仓库关联到一个 Vercel 项目，并部署默认分支；之后默认分支上的提交会自己部署。团队账号要部署到高于 Hobby 的 Vercel team。
4. 框架选 Next.js 即可，M0 没有密钥。构建命令是 `npm run build`，不需要改输出目录。

GitHub Actions 文件在仓库里，但 **Origin 上的推送不会跑 GitHub Actions**。Origin 文档里，Depot 或 Buildkite 可以跑这些 workflow；在那之前，本地用上面的 npm 命令检查。

## 以后如果要再加一个 GitHub 远程

等 GitHub 账号可以用了再做。Origin 仍然是 Cursor 这边的真源，不要用 GitHub 地址换掉现有的 `origin`。

1. 在你自己的 GitHub 账号下新建一个**空**仓库。不要勾选 README、`.gitignore` 或 license，免得和已有提交冲突。
2. 在本地另加一个远程，名字用 `github`，地址换成你刚建的那个。不要套用任何示例用户名：

   ```bash
   git remote add github git@github.com:<你的用户名>/<仓库名>.git
   git push -u github main
   ```

3. 推上去之后，`.github/workflows/ci.yml` 会在 GitHub 的 push 上跑 lint、类型检查、YAML 校验和构建。`ingest.yml` 目前只是每天打印 TODO 的空操作，不会发请求，也不会改文件。
4. 若还要把 GitHub 上的仓库镜像回 Origin，用 Origin 自己的 “Sync from GitHub”，不要在文档或脚本里写死一个还不存在的 owner/repo。

## 目录

```
data/contests/          YAML 真源
src/lib/contest-schema.ts
src/lib/contest-files.ts
src/lib/contests.ts
src/app/page.tsx        列表
src/app/contests/[slug]/page.tsx
.github/workflows/ci.yml
.github/workflows/ingest.yml
```

## 现在故意没做的事

- 不抓官网，不写适配器，不提交抓取结果
- 不生成 ICS
- 不下载、不镜像、不热链作品图片
- 没有后台，改数据就是改 YAML 再部署
