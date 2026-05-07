# Patch node:sea Windows bug then start Expo
$externalsPath = "node_modules\expo\node_modules\@expo\cli\build\src\start\server\metro\externals.js"
$content = Get-Content $externalsPath -Raw
if ($content -notmatch "x\.includes\(':'\)") {
    $patched = $content -replace "!\['sys'\]\.includes\(x\)\)", "!['sys'].includes(x) && !x.includes(':'))"
    Set-Content $externalsPath $patched -Encoding UTF8
    Write-Host "Patched externals.js for node:sea fix" -ForegroundColor Green
} else {
    Write-Host "externals.js already patched" -ForegroundColor Yellow
}
npx expo start --clear
