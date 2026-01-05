param (
    [string]$SourceDir = ".\docs",
    [string]$DestDrive = "G:\",
    [string]$DestFolderName = "DataPrism_Docs"
)

$ErrorActionPreference = "Continue"

Write-Host "Preparing to sync docs to Google Drive (with .txt conversion)..."
Write-Host "Source: $SourceDir"
Write-Host "Target Drive: $DestDrive"

# 1. Check G Drive
if (-not (Test-Path $DestDrive)) {
    Write-Warning "Skipping Sync: Google Drive ($DestDrive) not found. Please ensure Google Drive Desktop is running."
    exit 0 # Soft exit to not break build chain
}

# 2. Dynamic Discovery of Drive Root
$rootItem = Get-ChildItem -Path $DestDrive -Directory | Select-Object -First 1
if (-not $rootItem) {
    Write-Warning "Skipping Sync: Drive ($DestDrive) appears empty."
    exit 0
}
$driveRoot = $rootItem.FullName
Write-Host "Detected Drive Root: $driveRoot"

# 3. Set destination
$destPath = Join-Path $driveRoot $DestFolderName
Write-Host "Target Path: $destPath"

# 4. Create destination directory
if (-not (Test-Path $destPath)) {
    New-Item -ItemType Directory -Path $destPath | Out-Null
}

Write-Host "Starting Sync (Converting .md -> .txt)..."
Write-Host "--------------------------------------------------"

# 5. Custom Sync Logic
$sourceFiles = Get-ChildItem -Path $SourceDir -Recurse -File

foreach ($file in $sourceFiles) {
    # Get relative path
    $relativePath = $file.FullName.Substring((Resolve-Path $SourceDir).Path.Length)
    
    # Determine Target Filename
    # If it's markdown, append .txt (NotebookLM loves .txt)
    $targetName = $relativePath
    if ($file.Extension -eq ".md") {
        $targetName = $relativePath + ".txt"
    }

    # Build full destination path
    $targetFile = Join-Path $destPath $targetName
    $targetDir = Split-Path $targetFile -Parent

    # Create Sub-folder if missing
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    # Copy Logic: Only if source is newer or target missing
    $shouldCopy = $true
    if (Test-Path $targetFile) {
        $destInfo = Get-Item $targetFile
        if ($destInfo.LastWriteTime -ge $file.LastWriteTime) {
            $shouldCopy = $false
        }
    }

    if ($shouldCopy) {
        Copy-Item -LiteralPath $file.FullName -Destination $targetFile -Force
        Write-Host "Synced: $targetName"
    }
}

Write-Host "--------------------------------------------------"
Write-Host "Sync Completed!"
