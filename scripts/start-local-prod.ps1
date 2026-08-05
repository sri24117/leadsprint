$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env.local"

if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $parts = $line.Split("=", 2)
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

Set-Location (Join-Path $projectRoot ".next\standalone")
node server.js
