# Grass Field Batch02 接入记录

本次沿用 Cocos Creator 3.8.8、原生 2D 场景和 Walk V02 橘猫。一级嫩青草换成三组成熟草/短茬 Sprite；五级共用新的滚动地面。二至五级作物保留原有不同造型，经济、升级价格和存档版本不变。

## 打开与复现

使用 Creator 3.8.8 打开工程，等待导入，运行 `assets/scenes/Main.scene`。一级点击一次开始即可观看；`assets/scenes/GrassFieldLab.scene` 是独立一级田地样机，使用临时进度，不覆盖 Main 存档。`ScytheLab.scene` 同样使用新嫩青草，`MachineLab.scene` 保留机械样机。

修改前的工程备份：`temp/before-grass-batch02-20261028-164037.zip`，包含 assets、settings、package.json、tsconfig.json 和 README。

## 素材与参数

- 原始素材和说明完整保留在 `docs/Grass_Field_Batch02`；12 张可正常解码的 PNG 原样复制至 `assets/resources/grass-batch02`。
- 原包 `ground_right_edge.png` 数据截断。没有修改或补画原图；运行时从完好的 `ground_scroll.png` 按 x=0/208/560、宽=208/352/208 创建三个 SpriteFrame UV 区域，共用一张纹理。只画分区，不叠画整图。
- 每簇对应一个原有收割单元。A/B/C 由行、列、轮次与垄号稳定选择，同字母成熟草和短茬配对。
- 六张草图使用完整 512×512 画布，显示尺寸 80×80，锚点 `(0.5,0.0625)`；不按不透明区域裁剪缩放。切断后 0.12 秒轻倒、压缩、淡出，再在同一根节点切换对应短茬。
- 保留原有镰刀接触位置、28 行距和窄垄，一级列中心约 x=102/144，田心 x=123。参考包中的宽田示例只是起步值，当前宽度匹配实际刀刃覆盖范围。
- 土地中央宽度为当前垄宽+32，两侧分区填充剩余视口。两个地面段各高 1024，三分区使用相同偏移。累计距离由轮次、垄号、当前推进距离统一计算，作物与短茬使用同一行推进距离。
- 每次有效切割生成 3 片碎屑，尺寸 7/9/11，寿命 0.32 秒，上限 48，使用对象池。碎屑只提供表现，不改变金币。
- 只生成可视行和缓冲；作物按根部 Y 排序，脚后短茬在前景，工具区域仍可见。对象池重新绑定时清理旧的角度、缩放、透明度与配对状态。
- 换垄沿用正常地面及现有淡变；可选 `transition_empty_band` 不作为循环贴图使用。

## 代码位置与替换

`assets/scripts/GrassSkin.ts` 管理纹理、分区地面、配对草图和碎屑池；`GrassLayout.ts` 管理显示参数与连续偏移；`Field.ts` 对接原收割事件、排序和作物池；`GrassAssetConfig.ts` 保留原包配置。`tools/import-grass.cjs` 可重新导入有效原图。

替换正式草图时保持文件名、512 画布和根部锚点；成熟草/短茬须同字母配对，保持相同缩放。不要改变经济单元数量。地面若替换，应继续提供 768×1536 的整图和相同分区，验证首尾与镜像中间接缝。

## 验证证据

自动检查命令：`./tools/verify.ps1`、`python tests/grass_pixels.py`。实际引擎构建和 WebGL 检查分别记录在 [build.json](verification/grass-batch02/build.json) 与 [results.json](verification/grass-batch02/results.json)，源图解码及接缝检查见 [pixels.json](verification/grass-batch02/pixels.json)。运行脚本是 `tools/test-grass.cjs`，连接 `node tools/serve.cjs` 提供的本地 Web 构建。

实际运行截图：[田地初始](verification/grass-batch02/ready.png)、[收割中](verification/grass-batch02/running.png)、[切断倾倒](verification/grass-batch02/cut-fall.png)、[对应短茬](verification/grass-batch02/stubble.png)。[正常速度收割录像](verification/grass-batch02/grass-harvest.mp4)。连续两轮检查使用调试单步加速，不能当作真机正常速度或性能证据。

本次通过：3.8.8 Web 构建（退出码 36）、类型检查、原经济/购买锁定/低帧率/存档测试、V02 步态测试和新增草图/地面测试。实际 WebGL 运行正常速度收割 14 个单元获得 14 金币；调试单步累计 190 个单元进入第 3 轮，无重复 ID；暂停冻结草图倾倒、地面与碎屑；成熟草换对应短茬时根部位置与画布不变，短茬下移量与地面一致；反馈池峰值 48 且不改变余额；重载金币、局部 mask 和短茬一致；样机场景写入隔离。一级作物节点峰值 64，五级初始可视缓冲 112，未创建整田 3600 个对象。运行错误列表为空。

运行检查中修复了 Cocos 转译 Map 迭代器展开导致排序异常的问题，改用 `Array.from`；恢复时不重放倾倒动画，已结算单元直接显示对应短茬。

微信新构建、手机实际遮挡和声音、连续 15 分钟 30 FPS/内存测试：**未验证**。真机应打开 Main，一级连续两轮，检查地面接缝、刀刃接触和短茬下移；再切各级运行 15 分钟，观察帧率和内存趋势。当前草图只提供整簇视觉对应，不能展示逐根茎秆断裂；原地面含镜像纹理，宽田比例和侧边拉伸最值得后续美术联调。
