param([string]$CreatorRoot='D:\ProgramData\cocos\editors\Creator\3.8.8')
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$compiler=Join-Path $CreatorRoot 'resources\app.asar.unpacked\node_modules\typescript\lib\tsc.js'
if(!(Test-Path -LiteralPath $compiler)){throw 'Creator 3.8.8 TypeScript compiler not found. Pass -CreatorRoot.'}
& node $compiler --noEmit --pretty false
if($LASTEXITCODE -ne 0){throw 'Project type check failed'}
& node $compiler assets/scripts/Config.ts assets/scripts/HarvestModel.ts assets/scripts/GrassLayout.ts assets/scripts/SwingSequence.ts --module commonjs --target ES2017 --outDir temp/model-tests --skipLibCheck
if($LASTEXITCODE -ne 0){throw 'Model compile failed'}
& node tests/model.test.cjs
if($LASTEXITCODE -ne 0){throw 'Model tests failed'}
& node tests/cat-walk.test.cjs
if($LASTEXITCODE -ne 0){throw 'Cat walk / geometry tests failed'}
& node tests/grass.test.cjs
if($LASTEXITCODE -ne 0){throw 'Grass resource / layout tests failed'}
& node tests/swing-sequence.test.cjs
if($LASTEXITCODE -ne 0){throw 'Swing sequence tests failed'}
& node tests/v03-rig.test.cjs
if($LASTEXITCODE -ne 0){throw 'V03 rig tests failed'}
& node tests/push-harvester.test.cjs
if($LASTEXITCODE -ne 0){throw 'Push harvester Color V03 tests failed'}
& node tests/sickle-walk.test.cjs
if($LASTEXITCODE -ne 0){throw 'Sickle walk V02 tests failed'}
& node tests/ride-harvester.test.cjs
if($LASTEXITCODE -ne 0){throw 'Ride harvester V02 tests failed'}
& node tests/combine-harvester.test.cjs
if($LASTEXITCODE -ne 0){throw 'Combine harvester V01 tests failed'}
& node tests/fullscreen-harvester.test.cjs
if($LASTEXITCODE -ne 0){throw 'Fullscreen harvester stage five tests failed'}
& node tests/rice-harvester.test.cjs
if($LASTEXITCODE -ne 0){throw 'Rice harvester stage six tests failed'}
