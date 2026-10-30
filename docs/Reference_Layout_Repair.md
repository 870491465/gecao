# 参考图构图修复

本轮按参考图调整了宽田、猫、升级卡和顶部信息的相对比例。继续使用 Cocos Creator 3.8.8，原 V02 手臂与镰刀 PNG 保留，没有重新启用几何长杆。

## 打开正确入口

**宽田构图验收：**打开 `assets/scenes/ReferenceLayoutLab.scene`，点击 Creator 预览。这个场景用于比较参考图，明确标有“构图验收 · 宽田收割未接入”，暂停模拟，不写 Main 存档。

**开始游戏入口已补齐：**底部现在显示“开始游戏”，点击后切换到 Main，等资源就绪自动开始或继续原进度。示例 84 金币不会传入 Main。界面已注明进入的仍是当前可玩的窄作业带；这不是宽田收割已经完成。停止旧预览并重新预览场景即可看到新入口。

**可玩流程：**`assets/scenes/Main.scene` 已同步新的 UI，但仍保留现有刀刃能完整覆盖的窄作业带。它不是已经完成的宽田收割。

## 已调整

- 参考场景种植土带居中，显示宽 440，占 720 设计宽约 61%；猫位于中下部、脚底 `(0,-205)`，整体等比显示为 0.19，更贴近参考图中猫占田面的比例。Main 保持原 0.17，不改其接触判定。
- 前方草簇改用更大的完整 PNG，减少重复行数，覆盖整个种植面。后方改为高低错落、疏密不一的细茬构图，不再排列两条小草团。
- 细茬是参考场景独立的 Graphics 视觉占位，一次批量绘制；不修改 Main 的草茬配对素材，不冒充实际结算出来的作物状态。
- 升级卡下移到角色前方。Main 保留必要的作物与收益说明；参考场景采用更简洁的卡片排版。
- 金币、设备胶囊与设置齿轮位置靠近参考图；进度缩到设备信息下方。开发和动画按钮从 Main 主画面移到设置内。
- UI 镰刀图标换用 V03 独立镰刀贴图，按原图比例显示；购买价格配金色硬币图标。V03 静态素材仅作 UI 图标，没有当成正式动作帧。
- 猫的地面影子改为低透明度暖色，避免原来绿块般的影子。

## 文件

- `ReferenceLayoutLab.ts`、`ReferenceField.ts`、`ReferenceLayoutLab.scene`：隔离的宽田视觉验收。
- `HarvestGame.ts`：共用 UI、价格图标、设置中的调试入口。
- `EquipmentArt.ts`、`assets/resources/ui/sickle_inward.png`：真实静态工具图标。
- `HybridCatActor.ts`：独立升级提示锚点下移，身体与脚底不变。
- `Actor.ts`：影子颜色及透明度。
- `AnimationDebug.ts`：增加关闭按钮，方便从设置进入后退出。

修改前备份：`temp/before-reference-repair-20261028-194849.zip`。

## 验证

构建：[build.json](verification/reference-layout-repair/build.json)。实际 WebGL 检查：[results.json](verification/reference-layout-repair/results.json)。

通过项：Main 点击开始后仍实际收割，暂停正常；设置内可进入并关闭动画检查；参考场景不推进、不发钱，84 金币仅是标明用途的排版示例；参考场景不会写 Main 存档。截图包括 720×1280 与 390×844 浏览器视口。

[宽田构图效果](verification/reference-layout-repair/reference-layout.png) · [手机比例视口](verification/reference-layout-repair/reference-mobile-viewport.png) · [Main 共用 UI](verification/reference-layout-repair/main-ui.png)。

开始入口修复的最新检查：[results.json](verification/reference-start/results.json)、[入口截图](verification/reference-start/start-entry.png)、[实际游戏运行](verification/reference-start/main-playing.png)。通过：点击进入并自动开始、新档无 84 示例金币污染、已有 37 金币及部分切割进度恢复、连点只加载一次、后台取消自动开始。原经济和存档格式未修改。

## 尚未解决

当前正式挥镰序列仍为零，现有短镰刀只能覆盖右前侧的小范围。宽田场景因此没有模拟整幅收割，不能拿它的视觉草茬当作刀幅覆盖或收入验证。把宽田并入可玩 Main 仍需要可验收的大幅动作，以及对应的实际刀刃轨迹。

参考图中的猫姿态、尾巴和部分材质与现有原图也不同；本轮没有修改原角色图来伪造这些姿态。真机、微信新构建、长时帧率与内存仍未验证。
