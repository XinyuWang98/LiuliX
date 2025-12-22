# Pyodide 离线包下载脚本
# 使用方法：在 public/pyodide 目录下运行此脚本

Write-Host "🚀 开始下载 Pyodide 0.26.4 离线包..." -ForegroundColor Green

$VERSION = "0.26.4"
$BASE_URL = "https://github.com/pyodide/pyodide/releases/download/$VERSION"

# 下载核心包
Write-Host "`n📦 下载核心包..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "$BASE_URL/pyodide-$VERSION.tar.bz2" -OutFile "pyodide.tar.bz2"

# 解压
Write-Host "`n📂 解压中..." -ForegroundColor Yellow
tar -xf pyodide.tar.bz2 --strip-components=1

# 清理压缩包
Remove-Item pyodide.tar.bz2

Write-Host "`n✅ 下载完成！" -ForegroundColor Green
Write-Host "📊 文件统计：" -ForegroundColor Cyan
Get-ChildItem | Measure-Object -Property Length -Sum | Select-Object Count, @{Name="TotalSizeMB";Expression={[math]::Round($_.Sum/1MB,2)}}

Write-Host "`n⚡ 现在可以运行 'npm run build' 进行生产构建" -ForegroundColor Green
