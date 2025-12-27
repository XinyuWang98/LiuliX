
Write-Host "🚀 开始下载 Ollama 安装程序..."
$url = "https://ollama.com/download/OllamaSetup.exe"
$output = "OllamaSetup.exe"

try {
    Invoke-WebRequest -Uri $url -OutFile $output
    Write-Host "✅ 下载完成，正在启动安装..."
    Start-Process $output -Wait
} catch {
    Write-Host "❌ 下载失败: $_"
    exit
}

Write-Host "⏳ 等待 Ollama 服务启动..."
Start-Sleep -Seconds 10
# 简单的等待逻辑，实际可能需要更久的等待或者检测端口

Write-Host "📥 正在拉取 qwen2.5-coder:3b 模型..."
ollama pull qwen2.5-coder:3b

Write-Host "🎉 全部完成！"
Pause
