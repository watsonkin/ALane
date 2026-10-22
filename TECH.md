# 作品索引

这是产品上的索引，不是版权结论。页面不展示作品照片，也不展示主办方商标。有源链时新标签离开本站。

## 每件作品

`gallery_works` 里每一条都要有：

- `source_page_url`：源站上**这一件作品**的页面。不能填获奖列表、赛事首页、`gallery_urls` 里的整届页面，也不能填 `.jpg` 这类原图文件。详情里「查看原图 / View on official site」只用这个地址，`target="_blank"`，`rel="noopener noreferrer"`，没有站内中转。没有这个地址就不放该入口。
- `thumb_path`：可选遗留字段。若填写，仍是 `thumbs/{contest-id}/文件名.jpg|png|webp`，放在 `public/` 下，最长边不超过 400 像素。页面不读取它，作品位一律是灰底 `#E8E4DC`、字色 `#8A8A8A`。
- `source_site_label`：来源站名。页面先写「来源：主办方官网 / Source: organizer site」，再附这个站名。
- 可选 `title`、`author_name`、`author_homepage_url`。作者主页是另一条外链，不包住占位块。

## 步骤

1. 打开主办方获奖页，只收集能对应到单件作品的页面地址。整届列表继续放在 `gallery_urls`，不要写进 `source_page_url`。
2. 不要为本站下载或保存作品图。新条目不要填 `thumb_path`，也不要新增 `organizer_icon`。
3. 在该场 YAML 写入 `gallery_works`。`npm run validate-data` 会拒绝外链缩略图和获奖列表页。若旧数据仍写了 `thumb_path`，文件须存在且最长边不超过 400 像素；页面仍不展示它。
4. 移出索引：关于页的邮箱收到请求后，删掉 YAML 条目。若该场还留着 `public/thumbs` 或 `public/icons/organizers` 里的文件，一并删掉，再构建部署。

`thumb_path` 可以留空。列表默认展示全部赛事，卡片标明开放中、已截止或待定，不因缺图把整卡拿掉。首页「即将截止」只收仍开放、且截止日在未来 60 天内的赛事，按截止升序，最多 8 条；没有命中时留短文案和列表入口，不用已截止凑数。列表、即将截止、详情获奖索引和获奖廊的图位都是灰底 `#E8E4DC`、字色 `#8A8A8A`：中文界面写赛事名或作品 title，英文界面写名称首字母。不渲染 `/thumbs/`，也不渲染 `organizer_icon` 或 `/icons/organizers/`。作品名仍显示；来源写成「来源：主办方官网」，有 `source_page_url` 时给「查看原图」。获奖廊条目同理，链到该条 `gallery_urls`。`health: ok` 且没有权利标签时，芯片写「主办方官网 / Organizer site」，不写 Trusted。详情页正文最宽 760px：状态芯片和「打开官网」在标题带，截止与权利芯片在紧凑 meta；开放、公布、地理、届次为空时不占行，只写在默认折叠的「技术/采集信息」里。状态和权利各出现一次，不另开空节。首页首屏不挂装饰大图：文案下 24px 接到「即将截止」，只留纸底和一条细线。

仓库里可能仍有 `public/thumbs/` 和 `public/icons/organizers/`，YAML 里也可能仍写着 `thumb_path` 或 `organizer_icon`。这些都不进入页面。Pure Street、Life Framer、街拍视界、Aussie Street 和 BSPF 的 `/years/2025` 仍然只有整届或多人列表，`gallery_works` 留空，详情用「还没有单件作品页」而不是假的查看原图。
