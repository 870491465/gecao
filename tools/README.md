# 工具说明

从工程根目录运行。构建输出在 `build/`，日志在 `temp/`，截图和检查结果在 `docs/verification/`；这些目录不提交到 Git。

| 命令 | 用途 |
| --- | --- |
| `./tools/verify.ps1` | TypeScript、玩法、几何和素材检查 |
| `./tools/build.ps1 -Platform web-mobile` | Web 调试构建，Cocos 成功退出码为 36 |
| `./tools/build.ps1 -Platform wechatgame -Release` | 微信正式构建，需配置自己的 AppID |
| `node tools/serve.cjs` | 本地 Web 预览，默认端口 8092，可设置 `PORT` |
| `python tools/organize-assets.py` | 更新素材分类副本及 SHA-256 清单 |
| `python tools/pack-rice-atlas.py --check` | 检查水稻图集与源图逐像素一致 |
| `node tools/capture-previews.cjs` | 从 Web 调试构建生成六级截图和升级 GIF 到 `docs/previews/`；需要 FFmpeg（可设置 `FFMPEG_EXECUTABLE`） |

浏览器检查需要 Playwright 和 Chromium。可设置 `PLAYWRIGHT_MODULE`（包路径）、`CHROMIUM_EXECUTABLE`（浏览器路径）和 `HARVEST_TEST_URL`。多数脚本默认端口为 8092 或 8093；`test-rice-smoothness.cjs` 和 `profile-rice.cjs` 当前使用 8093。

## 当前浏览器检查

| 脚本 | 检查内容 |
| --- | --- |
| `test-continuous-play.cjs` | 无暂停按钮、设置中持续收割、前台自动继续、底部适配 |
| `test-haystacks.cjs` | 稀疏草垛、位置稳定、未收割区域无草垛、节点复用 |
| `test-combine-discharge.cjs` | 第四至六级喷口、草/水稻碎屑、粒子数量和回收 |
| `test-rice-smoothness.cjs` | 共享图集、布局与排序缓存、倒伏过渡、收益 |
| `test-grass-debris.cjs` | 六级割草碎屑与结算独立性 |
| `profile-rice.cjs` | 密集水稻场景的无录屏性能采样 |

其余 `test-*.cjs`、`visual-test.cjs` 和 `runtime-test.cjs` 保留各次素材接入、历史界面及样机验证，其中部分模拟旧版暂停按钮和布局，不是当前界面的验收入口。

`setup*.cjs`、`import-*.cjs` 和 `build-cat-validation.cjs` 是早期建场景、导入素材的工具。常规运行不需要重新执行，以免覆盖已经调整的场景或配置。
