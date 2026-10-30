param([ValidateSet('web-mobile','wechatgame')][string]$Platform='web-mobile',[string]$CreatorRoot='D:\ProgramData\cocos\editors\Creator\3.8.8',[switch]$Release)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$projectPath=(Get-Location).Path
$editor=Join-Path $CreatorRoot 'CocosCreator.exe'
if(!(Test-Path -LiteralPath $editor)){throw 'Creator 3.8.8 not found. Pass -CreatorRoot.'}
$configName=if($Platform -eq 'wechatgame'){'build-wechat.json'}else{'build-web.json'}
$config=Get-Content -LiteralPath (Join-Path $PSScriptRoot $configName) -Raw | ConvertFrom-Json
$config.debug=!$Release.IsPresent
$configPath=Join-Path $projectPath ('temp\build-config-'+$Platform+'.json')
$config | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $configPath -Encoding UTF8
$args='--project "'+$projectPath+'" --build "configPath='+$configPath+'"'
$proc=Start-Process -FilePath $editor -ArgumentList $args -WindowStyle Hidden -RedirectStandardOutput ('temp\build-'+$Platform+'.log') -RedirectStandardError ('temp\build-'+$Platform+'-errors.log') -PassThru -Wait
Write-Output ('Creator exit: '+$proc.ExitCode+' (36 means success). See temp/build-'+$Platform+'.log')
if($proc.ExitCode -ne 36){throw 'Build did not report success. Inspect logs.'}
