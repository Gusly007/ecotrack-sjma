param(
  [string]$BaseUrl = "http://localhost:3010"
)

$ErrorActionPreference = 'Stop'

Write-Host "Running security smoke test against: $BaseUrl"

$env:BASE_URL = $BaseUrl
npm run test:smoke
