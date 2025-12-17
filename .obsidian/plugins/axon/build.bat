@echo off
setlocal enabledelayedexpansion

echo 🚀 开始编译 Axon 插件...

REM 检查 esbuild 是否安装
esbuild --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：esbuild 未安装
    echo 请运行: npm install -g esbuild
    pause
    exit /b 1
)

REM 编译文件
echo 📦 编译 main.ts
esbuild main.ts --bundle --outfile=main.js --platform=browser --external:obsidian
if %errorlevel% neq 0 (
    echo ❌ 编译失败
    pause
    exit /b 1
)

echo 📦 编译 src\core 文件夹
for %%f in (src\core\*.ts) do (
    echo 编译: %%f
    esbuild "%%f" --bundle --outfile="%%~nf.js" --platform=browser --external=obsidian
)

echo 📦 编译 src\ui 文件夹
for %%f in (src\ui\*.ts) do (
    echo 编译: %%f
    esbuild "%%f" --bundle --outfile="%%~nf.js" --platform=browser --external=obsidian
)

echo.
echo ✨ 编译完成！
echo.
echo 📋 生成的文件：
dir /b *.js src\core\*.js src\ui\*.js 2>nul

echo.
echo 📌 下一步：
echo 1. 将所有文件复制到 %APPDATA%\Obsidian\plugins\axon\
echo 2. 在 Obsidian 中启用插件
echo.
pause
