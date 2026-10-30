"""Copy and inventory the current Main.scene art without modifying source assets."""
from pathlib import Path
from collections import defaultdict
import csv
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / 'assets/resources'
OUT = ROOT / 'docs/素材整理'
USED = OUT / '01_已使用'
UNUSED = OUT / '02_主游戏未使用'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def rel(path):
    return path.relative_to(ROOT).as_posix()

groups = {
    'cat-sickle-walk-v02': ('01_一级_挥镰刀', '一级小猫挥镰刀与行走', 'SickleWalkActor.ts'),
    'cat-push-color-v03': ('02_二级_新版手推车', '二级新版小猫及手推车整帧动画', 'PushHarvesterActor.ts'),
    'cat-ride-v02': ('03_三级_骑乘收割车', '三级骑乘收割车', 'RideHarvesterActor.ts'),
    'cat-combine-v01': ('04_四级_联合收割机', '四至六级联合收割机共用动画与宽滚筒材质', 'CombineHarvesterActor.ts'),
    'upgrade-fx-v01': ('05_升级特效', '三个升级共用的透明特效序列', 'UpgradeFX.ts'),
    'grass-batch02': ('06_草地与草屑', '滚动地面、成熟草、草茬及草屑', 'GrassSkin.ts'),
    'equipment-ui-v01': ('07_界面与装备图标', '四级装备图标、锁、选中框与按钮底图', 'EquipmentUIAssets.ts'),
    'ui': ('08_开始图标', '用户提供的绿色开始图标', 'EquipmentUIAssets.ts'),
    'audio': ('09_音频', '背景音乐、收割音效与升级音效', 'Sound.ts'),
    'sickle-slash': ('10_镰刀刀光', '一级镰刀切草时的短刀光', 'SickleWalkActor.ts'),
    'rice-v01': ('11_水稻', '第六级稻株、稻茬、稻粒与碎叶', 'GrassSkin.ts'),
}

expected = {}
for package in ['cat-sickle-walk-v02', 'cat-push-color-v03', 'cat-ride-v02', 'cat-combine-v01']:
    expected[f'{package}/animation.json'] = groups[package]
    prefix = 'swing' if package == 'cat-sickle-walk-v02' else 'push' if package == 'cat-push-color-v03' else 'ride' if package == 'cat-ride-v02' else 'combine'
    for i in range(24):
        expected[f'{package}/frames/{prefix}_{i:02}.png'] = groups[package]
for i in range(89):
    expected[f'upgrade-fx-v01/frames/upgrade_{i:03}.png'] = groups['upgrade-fx-v01']
for name in ['ground_scroll', 'grass_mature_A', 'grass_mature_B', 'grass_mature_C', 'grass_stubble_A', 'grass_stubble_B', 'grass_stubble_C', 'fx_leaf', 'fx_stem']:
    expected[f'grass-batch02/{name}.png'] = groups['grass-batch02']
equipment = ['equip_01_sickle', 'equip_03_push_harvester', 'equip_04_ride_harvester', 'equip_05_combine']
for name in ['tile_normal', 'selection_border', 'active_dot', 'lock', 'button_green'] + equipment + [n + '_gray' for n in equipment]:
    expected[f'equipment-ui-v01/textures/{name}.png'] = groups['equipment-ui-v01']
expected['ui/start_play.png'] = groups['ui']
expected['grass-batch02/grass_heap.png'] = groups['grass-batch02']
expected['sickle-slash/fx_sickle_slash.png'] = groups['sickle-slash']
expected['cat-combine-v01/wide-header.effect'] = groups['cat-combine-v01']
expected['rice-v01/assets.json'] = groups['rice-v01']
for name in ['rice-atlas.png','rice-atlas.json']:
    expected[f'rice-v01/{name}'] = groups['rice-v01']
for name in ['bgm.mp3', 'upgrade_v01.mp3']:
    expected[f'audio/{name}'] = groups['audio']
for name in expected:
    if not (RES / name).is_file():
        raise RuntimeError('Required current asset missing: ' + name)

def unused_reason(name):
    package = name.split('/')[0]
    if name.startswith('rice-v01/textures/'):
        return '图集制作源图：已无损烘焙入rice-atlas，运行时不单独加载；重建图集仍需保留'
    if name == 'audio/cut.wav':
        return '已取消的割草音效，不再加载或播放'
    if package == 'cat-push-v03':
        return '旧二级手推车及旧放大材质，已由 Color V03 全套替换'
    if package == 'cat-push-fixed-v02':
        return '旧二级猫颜色版本，已由 Color V03 修正颜色的整套动画替换'
    if package == 'cat-walk-v02':
        return '旧分层行走素材，CatPartsLab 样机仍引用；当前主游戏不用'
    if package in ['cat-v01', 'cat-swing-v03', 'cat-swing-sequence']:
        return '历史猫分层、挥刀方案或刀光；当前六级 Actor 分支不加载'
    if 'equip_02_long_sickle' in name:
        return '已取消的长柄镰刀等级图标'
    if package == 'grass-batch02' and Path(name).suffix == '.png':
        return '备用地面贴图；当前从 ground_scroll.png 裁出边缘和土壤，不单独加载'
    if name in ['audio/music.wav', 'audio/upgrade.wav']:
        return '旧占位音频，已改用 bgm.mp3 和 upgrade_v01.mp3'
    if Path(name).suffix == '.json':
        return '配置原稿或说明数据；当前运行时不直接加载，部分规则已写入 TypeScript'
    if name == 'ui/sickle_inward.png':
        return '旧镰刀贴图；一级现使用完整挥镰刀序列'
    return '当前 Main.scene 主游戏资源加载路径未引用'

# Original package inventory excludes verification screenshots and the new export.
source_dirs = sorted(p for p in (ROOT / 'docs').iterdir() if p.is_dir() and p.name not in ['verification', OUT.name])
source_files = sorted(p for folder in source_dirs for p in folder.rglob('*') if p.is_file())
source_files += sorted(p for p in (ROOT / 'docs').iterdir() if p.is_file() and p.name not in ['wechat-qr.png', 'wechat_qr.png'] and p.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.mp3', '.wav', '.mp4', '.zip'])
originals = defaultdict(list)
for path in source_files:
    originals[digest(path)].append(rel(path))

OUT.mkdir(parents=True, exist_ok=True)
records = []
used_hashes = defaultdict(list)
counts = defaultdict(lambda: [0, 0])
for path in sorted(p for p in RES.rglob('*') if p.is_file() and p.suffix != '.meta'):
    name = path.relative_to(RES).as_posix()
    sha = digest(path)
    if name in expected:
        stale = UNUSED / name
        if stale.is_file() and stale.is_relative_to(OUT):
            stale.unlink()
        category, purpose, code = expected[name]
        destination = USED / category / Path(name).relative_to(name.split('/')[0])
        status, reason = '已使用', purpose
        used_hashes[sha].append(rel(path))
        counts[category][0] += 1
        counts[category][1] += path.stat().st_size
        reference = 'assets/scripts/' + code
    else:
        package = name.split('/')[0]
        if package in groups:
            stale = USED / groups[package][0] / Path(name).relative_to(package)
            if stale.is_file() and stale.is_relative_to(OUT):
                stale.unlink()
        destination = UNUSED / name
        status, reason = '主游戏未使用', unused_reason(name)
        reference = ''
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination)
    if digest(destination) != sha:
        raise RuntimeError('Copy hash mismatch: ' + str(path))
    records.append({'状态':status, '用途或原因':reason, '工程原路径':rel(path), '整理副本':rel(destination), '对应docs原文件':' | '.join(originals.get(sha, [])), '代码依据':reference, '字节数':path.stat().st_size, 'SHA256':sha})

def write_csv(path, rows, fields=None):
    with path.open('w', encoding='utf-8-sig', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fields or list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

write_csv(OUT / '工程素材明细.csv', records)
source_records = []
for path in source_files:
    sha = digest(path)
    matches = used_hashes.get(sha, [])
    if matches:
        status, reason = '当前游戏已使用', '与运行时素材 SHA256 完全一致'
    elif rel(path).startswith('docs/OrangeCat_Rice_V01/textures/') and path.stem != 'rice_row_strip':
        status, reason = '合并图集使用（源图）', '像素无损合并进rice-atlas；保留源图用于制作和重建'
        matches = ['assets/resources/rice-v01/rice-atlas.png']
    elif path.suffix.lower() in ['.md', '.txt', '.json', '.py']:
        status, reason = '配套文档或配置原稿', '不直接播放；可能用于生成、测试或代码规则，应随素材包保留'
    elif 'preview' in path.as_posix().lower() or path.suffix.lower() in ['.gif', '.mp4', '.jpg', '.jpeg'] or 'spritesheet' in path.name or path.name in ['before.png', 'after.png', 'source.png']:
        status, reason = '预览或源图，主游戏未直接使用', '游戏使用导出的逐帧 PNG；原图及预览单列'
    else:
        status, reason = '主游戏未直接使用', '未与当前加载的资源文件匹配，可能属于旧版、备用或制作原稿'
    source_records.append({'状态':status, '说明':reason, 'docs原文件':rel(path), '对应工程资源':' | '.join(matches), '字节数':path.stat().st_size, 'SHA256':sha})
write_csv(OUT / '原素材包逐文件明细.csv', source_records)

package_lines = []
for folder in source_dirs:
    rows = [r for r in source_records if r['docs原文件'].startswith(rel(folder) + '/')]
    used_count = sum(r['状态'] in ['当前游戏已使用','合并图集使用（源图）'] for r in rows)
    package_lines.append(f'| {folder.name} | {used_count} | {len(rows)-used_count} | {"部分或全部已接入" if used_count else "当前主游戏未直接使用"} |')

used_records = [r for r in records if r['状态'] == '已使用']
unused_records = [r for r in records if r['状态'] != '已使用']
summary = {
    'basis':'Main.scene 当前六级正式游戏的代码执行分支；不是构建包收录清单',
    'used_files':len(used_records), 'unused_in_main_files':len(unused_records),
    'used_bytes':sum(r['字节数'] for r in used_records), 'unused_in_main_bytes':sum(r['字节数'] for r in unused_records),
    'source_package_files':len(source_records), 'sha256_verified':True,
    'source_files_moved_or_deleted':False,
}
(OUT / '整理结果.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
readme = f'''# 当前游戏素材整理

以 `assets/scenes/Main.scene` 的六级主游戏为准，依据 Actor 分支、各级加载器、GrassSkin、EquipmentUIAssets、Sound 和 UpgradeFX 核对。此处为整理副本，原始 docs 素材包和 assets 均未移动、删除或修改。

- `01_已使用`：{len(used_records)} 个当前实际加载的资源文件，按用途分类，可直接查看。
- `02_主游戏未使用`：{len(unused_records)} 个仍留在 assets/resources 的旧版、样机、备用或配置原稿副本，保留原目录结构。
- `工程素材明细.csv`：每个工程资源的状态、原因、原路径、整理副本、对应 docs 原件、代码依据和 SHA256。Excel 可直接打开。
- `原素材包逐文件明细.csv`：逐个列出 docs 原素材包中的正式帧、源图、预览、图集、说明和制作脚本；这些文件没有再次全量复制。
- `整理结果.json`：文件数量及复制校验结果。

## 正在使用的素材

| 分类 | 文件数 | 大小 |
| --- | ---: | ---: |
'''
for category, (count, size) in sorted(counts.items()):
    readme += f'| {category} | {count} | {size/1048576:.2f} MB |\n'
readme += '''
前四级各有24帧及动画配置，第五、六级复用第四级车身原始帧和独立宽滚筒材质，不另复制车辆图片；第六级另有水稻素材。升级特效为 89 帧。背景音乐和升级音效属于已接入资源；割草音效已取消，不再加载。音效开关关闭不等于未使用。

地面左右边缘、中央土壤当前从 ground_scroll.png 中裁切，独立同名贴图不直接加载。设置齿轮、暂停符号、文字、阴影等由代码绘制，不另列图片。开始图标来自用户提供的图片，工程正式文件 ui/start_play.png 已单独归档。

## docs 原素材包使用情况

“未直接使用”包括说明、配置原稿、预览、合图和旧版，不表示整个素材包无用。数量按逐文件 SHA256 与正式资源匹配。

| 原素材包 | 已使用文件 | 其他文件 | 状态 |
| --- | ---: | ---: | --- |
'''
readme += '\n'.join(package_lines)
readme += '''

bgm.mp3 的原件位于 docs 根目录，对应已使用音频分类。cut.wav 为已取消的工程原有生成音效，已归入主游戏未使用分类，没有 docs 同名原件。

## 整理边界

“主游戏未使用”不等同于可以直接删除：CatPartsLab 等样机、历史测试和制作脚本仍可能依赖旧文件；部分 JSON 原稿的数据已转成 TypeScript 常量。resources 下的文件即使运行时未加载，也可能仍被 Cocos 收入构建包。本次仅复制和分类，不修改构建资源。

不复制 .meta：它们是 Cocos 的资源标识，不是图片或音频。docs/verification 内的验收截图、旧方案展示图，以及项目根目录的说明文档未作为正式素材纳入。

重新核对当前版本可执行 `python tools/organize-assets.py`。本清单对应此次整理时的代码，后续换素材后需重新生成。
'''
(OUT / 'README.md').write_text(readme, encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
