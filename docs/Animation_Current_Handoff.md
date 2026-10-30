# 当前动画方案交付核对

本次重新检查 docs 与现有代码，并对恢复 V02 原握持图之后的动画模块做了实际复测。继续使用 **Creator 3.8.8**；原经济、升级、存档和自动收割主流程保留。

## 现有资源

| 资源 | 实际可用内容 |
| --- | --- |
| OrangeCat_Walk_V02 | 6 张分层 PNG、独立双脚、步态参考和离线 walk_loop.gif |
| OrangeCat_Swing_V03 | 7 张静态补充部件及 1 张刀光；不是整猫挥镰序列 |
| Sickle_Slash_Addon | 1 张静态刀光，和 V03 刀光重复 |
| Grass_Field_Batch02 | 13 张草、草茬、碎屑和地面素材；截断的右侧地面仍按原修正取完整底图 UV |
| 合格整猫挥镰序列 | **0 套** |

没有新增可验收序列，也未把零散姿势或 V03 静态部件拼成正式帧。运行配置仍是 `clips: []`，缺素材标记为 `MISSING_APPROVED_FRAMES`。

## 已落地的接入

- CatRoot 固定脚底；WalkVisual、SwingVisual 互斥；SlashFX 与 UpgradeHint 独立。
- WalkVisual 当前使用原 V02 六层图，小幅临时挥割沿用同一张右臂与镰刀 PNG，不再实例化几何手臂、长杆或几何刀刃。
- 短序列模块支持逐帧时长、统一画布/脚底锚点/显示比例、有效命中窗及显式轨迹。回收到位后切回分层步态，地图和步态依据实际距离衔接；不使用自动动画循环发钱。
- 每刀 ID 集合与原 mask 保护、按经过时间排序、跨帧子步、暂停/恢复、后台等待继续、升级清理均保留。
- 调试入口支持单刀、循环、暂停、逐帧、锚点/轨迹/有效区域、本刀单位和金币、独立刀光及草屑开关。缺正式帧时明确显示“无序列帧／临时相位”。

入口：`Main.scene` 正常运行；`SwingSequenceLab.scene` 默认打开动画面板，使用隔离进度；`CatPartsLab.scene` 检查原分层静态与迈步。

## 配置与文件

正式 PNG 放置目录：`assets/resources/cat-swing-sequence/frames/`，当前只有放置说明，没有角色帧。

实际配置：[`sequence.json`](../assets/resources/cat-swing-sequence/sequence.json)。

禁用示例：[`sequence.example.json`](../assets/resources/cat-swing-sequence/sequence.example.json)。文件名与轨迹是接口示例，不代表已经存在或验收的图；只有美术、首尾衔接及刀刃轨迹验收后才能启用正式配置。

主要代码：`SwingSequence.ts`、`SwingAssets.ts`、`HybridCatActor.ts`、`AnimationDebug.ts`；原素材临时动作与实际接触点在 `ManualSickle.ts`。详细修改文件、字段、坐标约定和接入步骤见 [完整接入说明](Hybrid_Swing_Integration.md)；当前手臂修正见 [原图修正记录](Sickle_Original_Repair.md)。

## 本轮实际结果

`./tools/verify.ps1` 通过：类型、原经济/升级锁定/存档/低帧率、分层素材及新增序列数学测试。

`node tools/test-hybrid-swing.cjs` 在当前 Cocos WebGL 构建通过：单刀准确增加 2 金币；下一刀部分命中后暂停，帧相位、脚底根与刀光透明度保持不变；恢复后的 8 个事件 ID 全部唯一；后台不补发；独立场景不覆盖 Main；升级清除临时特效并保持暂停。资源加载期间不推进、不发钱、不丢配置标识。

运行时内存色块仅验证 Sprite 播放、变时长取帧、显示互斥、锚点和回到 WalkVisual；它们不是猫图，不写入资源目录，也不作为正式挥镰演示。

[本轮结果 JSON](verification/hybrid-swing/results.json) · [当前调试面板截图](verification/hybrid-swing/inspector-temporary-phase.png) · [迈步与原图临时挥割、中途暂停恢复录像](verification/hybrid-swing/temporary-walk-pause.mp4)。

未验证：正式序列中的脚底像素衔接、持刀是否换边、穿头/脱手与最终横扫手感（缺合格素材）；微信新构建、真机触摸/安全区与 15 分钟性能。程序锚点固定与元数据校验不能代替这些实际美术验收。
