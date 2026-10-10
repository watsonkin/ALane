# 缩略索引流水线

这是产品上的索引，不是版权结论。站内只留小图，点击离开本站。

## 每件作品

`gallery_works` 里每一条都要有：

- `source_page_url`：源站上**这一件作品**的页面。不能填获奖列表、赛事首页、`gallery_urls` 里的整届页面，也不能填 `.jpg` 这类原图文件。详情页缩略图的链接只用这个地址，`target="_blank"`，`rel="noopener noreferrer"`，没有站内中转。
- `thumb_path`：`thumbs/{contest-id}/文件名.jpg|png|webp`，文件放在 `public/` 下。最长边不超过 400 像素。
- `source_site_label`：来源站名，页面上写成「来源：{站名} · 点击前往源站查看原图」。
- 可选 `title`、`author_name`、`author_homepage_url`。作者主页是另一条外链，不包住缩略图。

## 步骤

1. 打开官方获奖页，只收集能对应到单件作品的页面地址。整届列表继续放在 `gallery_urls`，不要写进 `source_page_url`。
2. 看该站 `robots.txt`。允许时，只下载页面上已经是小图的候选（例如 srcset 里不超过 400 像素的地址），不要下高清原图。
3. 把候选缩到最长边 ≤ 400，保存到 `public/thumbs/{contest-id}/`。不提交原图，不把外链图片写进 `thumb_path`。
4. 在该场 YAML 写入 `gallery_works`。`npm run validate-data` 会拒绝外链缩略图、获奖列表页，以及超过 400 像素或缺失的文件。
5. 下架：关于页的邮箱收到请求后，删掉 YAML 条目和 `public/thumbs` 里的文件，再构建部署。

抓取被拦，或页面上只有超过 400 像素的大图时，可以先放标明「非原图」的索引卡，但 `source_page_url` 仍然必须是真实的单件作品页。LensCulture 在本环境返回 403，所以 `lensculture-street` 的四张图是索引卡，链接指向 `p1.lensculture.com/projects/…` 上的具体项目页。Eyeshot 系列页和 URBAN 的 Luis Olivan Tenorio 专访可以拿到不超过 600 像素的衍生图，已缩到最长边 ≤ 400。Sony Open 街拍画廊只有 `max_2600x2600` 大图、没有单张作品页，所以 `sony-wpa-street` 用索引卡，链接指向该届街拍类获奖者的 `team-profile`。Women Street Photographers 和 BSPF 的 `/years/2025` 仍然只有整届或多人列表，没有单件作品页，因此 `gallery_works` 留空。
