$ErrorActionPreference = "Stop"

# Config
$sourceDir = ".\docs"
$dateStr = Get-Date -Format "yyyyMMdd"
$outputZip = ".\docs_backup_for_notebooklm_$dateStr.zip"

Write-Host "Packing documentation..."
Write-Host "Source: $sourceDir"
Write-Host "Destination: $outputZip"

# Check Source
if (-not (Test-Path $sourceDir)) {
    Write-Error "Error: docs directory not found!"
    exit 1
}

# Remove old zip
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

# Compress
Compress-Archive -Path $sourceDir -DestinationPath $outputZip -Force

Write-Host "Backup Complete!"
Write-Host "File created at:"
Write-Host (Resolve-Path $outputZip).Path
