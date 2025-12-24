$ErrorActionPreference = "Continue"

# Config
$sourceDir = ".\docs"
$destDrive = "G:\"
$destFolderName = "DataPrism_Docs"

Write-Host "Preparing to sync docs to Google Drive (with .txt conversion)..."

# 1. Check G Drive
if (-not (Test-Path $destDrive)) {
    Write-Error "Error: Google Drive (G:) not found."
    Write-Warning "Please ensure Google Drive Desktop is running."
    exit 1
}

# 2. Dynamic Discovery of Drive Root
$rootItem = Get-ChildItem -Path $destDrive -Directory | Select-Object -First 1
if (-not $rootItem) {
    Write-Error "Error: G: drive appears empty."
    exit 1
}
$driveRoot = $rootItem.FullName
Write-Host "Detected Drive Root: $driveRoot"

# 3. Set destination
$destPath = Join-Path $driveRoot $destFolderName
Write-Host "Target Path: $destPath"

# 4. Create destination directory
if (-not (Test-Path $destPath)) {
    New-Item -ItemType Directory -Path $destPath | Out-Null
}

Write-Host "Starting Sync (Converting .md -> .txt)..."
Write-Host "--------------------------------------------------"

# 5. Custom Sync Logic
# We cannot use Robocopy because we need to rename files on the fly.
# Strategy: Iterate source files, copy to dest with new name.

$sourceFiles = Get-ChildItem -Path $sourceDir -Recurse -File

foreach ($file in $sourceFiles) {
    # Get relative path (e.g., \00-Intro\file.md)
    $relativePath = $file.FullName.Substring((Resolve-Path $sourceDir).Path.Length)
    
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
Write-Host "NOTE: All .md files have been renamed to .md.txt so NotebookLM can see them."
