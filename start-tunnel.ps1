# start-tunnel.ps1
# Script to start a secure Cloudflare Quick Tunnel to expose the Next.js dev server (port 3000)

$NodePath = "C:\Users\dmitriy.ivanovskiy\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.20_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v20.20.2-win-x64"

# Check if npx is available in current PATH
if (Get-Command "npx" -ErrorAction SilentlyContinue) {
    Write-Host "Starting Cloudflare Quick Tunnel via npx..." -ForegroundColor Green
    npx untun tunnel 3000
} elseif (Test-Path "$NodePath\npx.cmd") {
    Write-Host "Starting Cloudflare Quick Tunnel via Winget Node path..." -ForegroundColor Green
    $env:Path = "$NodePath;" + $env:Path
    npx untun tunnel 3000
} else {
    Write-Error "Could not find 'npx'. Please ensure Node.js is installed."
}
