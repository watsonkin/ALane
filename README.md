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
| `name` | 入库主名。展示时中文优先可选 `name_zh`，英文优先可选 `name_en`，缺了就用 `name` |
| `name_zh`, `name_en` | 可选。不填也不藏卡 |
| `official_url` | 官网，http(s) |
| `status` | `draft` / `published` / `archived` |
| `open_at`, `deadline_at`, `announce_at` | 带时区的时间，或 `null`。截止必须晚于开放 |
| `edition` | 届次，或 `null`。中文界面只用这一栏 |
| `edition_en` | 可选。英文界面优先它，没有再回退 `edition`。可空 |
| `geo` | `{ label, country?, city? }`，或 `null` |
| `online` | 是否含线上。纯线下时 `geo` 必填 |
| `fee` | `free` / `paid` / `mixed` / `unknown` |
| `street_photo_relevance` | `core` / `adjacent` / `unreviewed`（人工初标） |
| `rights_tags` | `transfer_copyright`、`exclusive`、`no_payment`、`moral_rights_waived`。空数组不是“安全”，页面也不写 Trusted。`health: ok` 且没有这些标签时，芯片写「主办方官网 / Organizer site」 |
| `gallery_urls` | `{ url, label?, label_zh?, label_en?, edition?, edition_en? }`。整届获奖列表的外链。英文界面优先 `label_en` 和 `edition_en`，中文界面优先 `label_zh`，缺了再用共用的 `label` / `edition`。只写一个 `label` 时中英都用它。展示时标题和届次用间隔号连接；两边相同，或一边已经包含另一边，就只留信息更多的那一侧 |
| `gallery_works` | 单件作品索引。`source_page_url` 必填，且必须是这一件作品的页面，不能是获奖列表或原图文件。`thumb_path` 可留在 YAML 里，页面不展示这张图。作品位是灰底占位；有源链时「查看原图 / View on official site」新标签打开 `source_page_url`。可选 `title`、`author_name`、`author_homepage_url`。`source_site_label` 必填。流水线见 [TECH.md](TECH.md) |
| `organizer_icon` | 可选遗留字段，页面不渲染。路径若填写，仍须是 `/icons/organizers/{slug}.svg`（也可不写开头的斜线），不能是外链。主办识别是文字名；详情上的官网按钮链到 `official_url` |
| `source_adapters` | `{ id, kind? }`。`kind` 为 `manual` / `jsonld` / `html` / `api`，缺省 `manual`。M0 不会执行它们 |
| `last_fetched_at`, `content_hash` | 抓取后才填。现在保持 `null` |
| `health` | `ok` / `warn` / `dead`。M0 只展示，不探测 |

未知字段会被 `.strict()` 拒绝，避免手写 YAML 时把名字写错还以为存进去了。

列表页的主筛选是开放窗口、费用和地区，默认只露这一行，芯片仍可点。同一个「展开筛选」会直接放出状态和相关度，收起后辅维芯片隐藏，已选条件仍生效。条件写在地址栏（`window`、`fee`、`region`，加上 `status`、`relevance`）。默认显示库内全部赛事。点「开放中」只看填写了截止时间且尚未过这次构建时刻的赛事；截止时间为空的状态是「待定」。已截止和待定仍留在默认列表里。地区里「含线上」看 `online`，国家按 `geo.country` 归到中国、欧洲、美洲、大洋洲或其他。详情页按 slug 读取同一份数据。

`/calendar.ics` 略过三个日期都空的赛事，名单写在关于页。已归档、或没有截止时间但仍有其他日期的条目，会在事件说明里注明。日历说明保持中文，只有一份订阅。

语言是 `zh-CN` 和 `en`。中文路径不带前缀（`/`、`/about`、`/contests/[slug]`），英文加 `/en`。优先级是地址、再是 Cookie `alane_locale`、再是 `Accept-Language` 里 q 最高的那一个标签：以 `zh` 开头（含 `zh-TW`）归 `zh-CN`，否则归 `en`。`<html lang>` 跟这条路径的语言走：中文根布局写 `zh-CN`，英文根布局写 `en`，进预渲染 HTML，不靠客户端事后改。顶栏 **中 | EN** 走 `/locale` 写入 Cookie（一年以上，`Path=/`，`SameSite=Lax`）再跳到对等路径，并带上筛选 query。选了英文之后刷新中文根路径会去 `/en`。访问 `/en` 会把 Cookie 写成 `en`。不看 IP，不用 hash。灰底占位中文用标题，英文用首字母。日期中文是 `2026年10月10日`，英文是 `10 Oct 2026`，都取时间戳里的日期前缀。

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
src/app/(zh)/layout.tsx 中文根布局，lang=zh-CN
src/app/(zh)/page.tsx   中文列表
src/app/en/layout.tsx   英文根布局，lang=en
src/app/en/page.tsx     英文列表
src/proxy.ts            语言跳转
src/app/(zh)/contests/[slug]/page.tsx
src/app/en/contests/[slug]/page.tsx
.github/workflows/ci.yml
.github/workflows/ingest.yml
```

## 现在故意没做的事

- 不抓官网，不写适配器，不提交抓取结果
- 不生成 ICS
- 不下载、不镜像、不热链作品图片
- 没有后台，改数据就是改 YAML 再部署
