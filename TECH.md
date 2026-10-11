# 缩略索引流水线

这是产品上的索引，不是版权结论。站内只留小图，点击离开本站。

## 每件作品

`gallery_works` 里每一条都要有：

- `source_page_url`：源站上**这一件作品**的页面。不能填获奖列表、赛事首页、`gallery_urls` 里的整届页面，也不能填 `.jpg` 这类原图文件。详情页缩略图的链接只用这个地址，`target="_blank"`，`rel="noopener noreferrer"`，没有站内中转。
- `thumb_path`：可选。有小图时是 `thumbs/{contest-id}/文件名.jpg|png|webp`，放在 `public/` 下，最长边不超过 400 像素。没有小图就留空，页面画灰块，不画文字图。
- `source_site_label`：来源站名，页面上写成「来源 · {站名}」。
- 可选 `title`、`author_name`、`author_homepage_url`。作者主页是另一条外链，不包住缩略图。

## 步骤

1. 打开官方获奖页，只收集能对应到单件作品的页面地址。整届列表继续放在 `gallery_urls`，不要写进 `source_page_url`。
2. 看该站 `robots.txt`。允许时，只下载页面上已经是小图的候选（例如 srcset 里不超过 400 像素的地址），不要下高清原图。
3. 把候选缩到最长边 ≤ 400，保存到 `public/thumbs/{contest-id}/`。不提交原图，不把外链图片写进 `thumb_path`。
4. 在该场 YAML 写入 `gallery_works`。`npm run validate-data` 会拒绝外链缩略图、获奖列表页，以及超过 400 像素或缺失的文件。
5. 下架：关于页的邮箱收到请求后，删掉 YAML 条目和 `public/thumbs` 里的文件，再构建部署。

没有已经小于等于 400 像素的衍生图时，不要下高清再缩小冒充照片。`thumb_path` 可以留空。列表默认展示全部赛事，卡片标明开放中、已截止或待定，不因缺图把整卡拿掉。首页「即将截止」只收仍开放、且截止日在未来 60 天内的赛事，按截止升序，最多 8 条；没有命中时留短文案和列表入口，不用已截止凑数。有官方小图用小图，没有则用灰底占位：中文界面写赛事名或作品 title，英文界面写名称首字母。作品名、来源和「前往源站」仍然显示，链接仍然是这一件作品的 `source_page_url`。

LensCulture 与 Sony 街拍目前就是这样：作品页是真的，照片文件没有小图。Eyeshot、URBAN 的 `photonew/?id=`、Leica Oskar Barnack 的获奖系列页、World Street Photo 的 Swan，PISPA 单件奖牌页上的 `m_` 小图，LSPF 单篇 Bump Books 获奖稿里的 250 像素衍生图，以及 Women Street Photographers 的 Adele Chan 单人页（Squarespace `format=300w`，300×200），用的是站方小图并缩到最长边 ≤ 400。Pure Street、Life Framer、街拍视界、Fujifilm Moment、Aussie Street、Ricoh 结果页和 BSPF 的 `/years/2025` 仍然只有整届或多人列表，`gallery_works` 留空。Sony 街拍画廊只有大图文件，没有单件 HTML 页。
