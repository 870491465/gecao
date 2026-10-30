# 橘猫 Walk V02 接入记录

当前版本：Cocos Creator **3.8.8**，未升级编辑器。依据 `OrangeCat_Walk_V02/README_Codex.md`、`parts_config.json` 和 `walk_motion.js` 接入。源目录原图、GIF、配置与 validation.json 保持不变。

## 运行入口

- `assets/scenes/Main.scene`：一级、二级手工收割已使用 V02 六层素材与距离驱动步态。
- `assets/scenes/ScytheLab.scene`：带田地的手工收割样机。
- `assets/scenes/CatPartsLab.scene`：更新为 V02 单猫检查场景。可在“仅走路 / 走割”间切换，支持静态拼装、暂停、慢速、单步、深浅背景和支点/刀刃显示。此场景不读写游戏存档。
- Web 构建：`build/web-mobile`，`node tools/serve.cjs` 后访问 `http://127.0.0.1:8092`。

若已打开的编辑器仍缓存旧脚本，切回编辑器等待资源刷新后再预览，必要时重新打开工程。本次继续使用 temp 验证副本构建，避免关闭用户已打开的编辑器或覆盖其未保存场景；验证副本与当前工程使用同一套 assets 和 3.8.8，结果见 `verification/cat-walk-v02/build.json`。

## 六层装配

六张原 PNG 原字节复制到 `assets/resources/cat-walk-v02/textures`；保留完整尺寸、归一化锚点、原局部缩放、透明度和排序，不自动裁切或翻转。

```text
ActorAnchor
└─ CatRoot                  固定地面中心，游戏比例 0.26
   ├─ cat_leg_left          原左腿脚，仅 Y 位移
   ├─ cat_leg_right         原右腿脚，仅 Y 位移
   └─ UpperBodyMotion      共享 0～3 设计像素起伏
      ├─ cat_left_arm
      ├─ cat_right_arm_sickle
      ├─ cat_body           新无脚身体
      └─ cat_tail
```

旧 `cat_body_feet` 不再实例化。V01 文件保留作为历史资源，不与新身体叠加，没有四只脚。两腿保持原位置基准、旋转 0、局部比例 0.75 / 0.7，仅添加数学采样的 Y 偏移；起伏通过统一上半身父节点实现，不重复叠加各层的原配置坐标。

机械阶段此前使用独立灰盒推车/驾驶节点，当前仍保留；本包没有推车手部或驾驶专用姿态，不把连镰刀右臂强行作为机械操作臂。

## 步态与收割同步

`CatWalkSource.ts` 原样复制提供的纯数学函数，默认步幅 A=12、抬脚 5、上半身起伏最多 3；“仅走路”模式采用源包 1.2 秒周期，用于与 GIF 对照。运行时没有将离线 GIF 当作动画资源。

游戏使用实际地图位移计算步态，不使用独立行走定时器：

`phase = (0.25 + 累计屏幕推进距离 / (4 × A × CatRoot比例)) mod 1`

当前行距 28、比例 0.26，主游戏 A 自动计算为约 **26.923 设计像素**，stride≈107.692 设计像素，即每推进一行完成一个步态周期。屏幕中的前后摆幅约 7 像素、抬脚约 1.3 像素、身体起伏最多约 0.78 像素。改变调试速度或挥割节奏时，脚步仍跟随实际位移，不单独加速或减速。

支撑半周期的脚位移导数为 -4A，因此脚的屏幕下降距离与地面滚动距离一致。行走相位从轮次、垄号及已保存的推进距离计算，换垄、换轮没有归零，不新增独立的存档时钟。

- 0～0.55 秒：地图与脚步静止，完成蓄力、挥出、切断和余势。
- 0.55～1 秒：回收与迈步，地图用 smoothstep 平滑起停，步态严格跟随该推进曲线。
- 挥刀保留此前调整的 **60°** 范围。每次切断仍由实际内刃经过作物触发，回刀不结算。
- 切割时上半身位于固定站姿起伏值 3，判定坐标同步增加对应的 0.78 屏幕像素，避免刀刃随身体上移后判定留在旧位置。
- 暂停、后台、换垄时冻结地图和步态；继续及重载按保存的推进距离恢复，不突然重置脚位。

没有改变金币单价、每行列数、田地规模、每秒处理行数、升级价格或存档 schema。仅平滑了每行内部的推进曲线，并据行距自动匹配步幅。

## 关键文件与重新导入

| 文件 | 用途 |
| --- | --- |
| `assets/scripts/CatPartsActor.ts` | 六层 Sprite 装配和 UpperBodyMotion |
| `assets/scripts/CatPartsConfig.ts` | V02 JSON 的生成副本 |
| `assets/scripts/CatWalkSource.ts` | 原样提供的 walk_motion.js |
| `assets/scripts/CatWalk.ts` | 可调步幅采样、距离到相位换算 |
| `assets/scripts/CatMotion.ts` | 60° 挥刀、平滑推进、内刃和站姿高度 |
| `assets/scripts/HarvestGame.ts` | 跨垄跨轮连续距离及恢复 |

重新导入使用 `node tools/import-cat-walk.cjs`，不要对当前六层版本运行历史 V01 导入工具。`./tools/verify.ps1` 执行当前模型与 V02 校验。

## 实际验证与证据

3.8.8 Web 构建成功（退出码 36）。实际 Cocos WebGL 场景通过：六层原尺寸装配、旧带脚身体不存在、地面根节点固定、双脚仅位移、挥割期间落点固定、两腿在推进段交替、起伏限幅、切割点与实际 Sprite 同步、暂停姿态冻结、重载姿态与余额一致。运行异常 0。

13 项原模型测试和新增 V02 校验通过，包括 PNG 哈希、原数学函数原样复制、支撑脚/地面导数一致、换垄/换轮相位连续，以及暂停和保存恢复。测试模拟不替代真机。

源透明度复查：121 个角度姿态未新增超过源包静态拼装的刀刃遮挡。V02 静态 0° 本身有 97 个源刀刃像素与身体毛边区域重叠，约占刀刃 0.29%；该接触在源参考拼装中也存在，未通过改锚点或镜像掩盖。实际画面已检查。

证据目录 `docs/verification/cat-walk-v02`：

- `walk-only.mp4`：仅走路实际画布录屏。
- `walk-harvest.mp4`：走路、停稳、挥刀、回收的实际录屏。
- `static-light.png`、`static-dark.png`、`phase-*.png`、`game-running.png`：实际运行截图。
- `results.json`、`build.json`、`alpha-overlap.json`：检查数据。

**未验证**：微信新包、Android/iPhone、15 分钟手机性能、真机毛边与色彩。`build/wechatgame` 若存在仍是早期版本，需要重新构建。本次没有把源素材离线 GIF 或源 validation.json 当作游戏实机验收。
