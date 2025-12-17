#!/bin/bash

# Axon Plugin Build Script
# 自动编译所有 TypeScript 文件为 JavaScript

echo "🚀 开始编译 Axon 插件..."

# 检查 esbuild 是否安装
if ! command -v esbuild &> /dev/null; then
    echo "❌ 错误：esbuild 未安装"
    echo "请运行: npm install -g esbuild"
    exit 1
fi

# 编译文件函数
compile_file() {
    local ts_file=$1
    local js_file="${ts_file%.ts}.js"

    echo "📦 编译: $ts_file -> $js_file"
    esbuild "$ts_file" --bundle --outfile="$js_file" --platform=browser --external:obsidian

    if [ $? -eq 0 ]; then
        echo "✅ 成功: $js_file"
    else
        echo "❌ 失败: $ts_file"
        exit 1
    fi
}

# 编译所有 TypeScript 文件
compile_file "main.ts"

if [ -d "src/core" ]; then
    for file in src/core/*.ts; do
        if [ -f "$file" ]; then
            compile_file "$file"
        fi
    done
fi

if [ -d "src/ui" ]; then
    for file in src/ui/*.ts; do
        if [ -f "$file" ]; then
            compile_file "$file"
        fi
    done
fi

echo ""
echo "✨ 编译完成！"
echo ""
echo "📋 生成的文件："
ls -lh *.js src/core/*.js src/ui/*.js 2>/dev/null | grep -v total

echo ""
echo "📌 下一步："
echo "1. 将所有文件复制到 ~/.obsidian/plugins/axon/"
echo "2. 在 Obsidian 中启用插件"
echo ""
echo "快速复制命令："
echo "cp -r * ~/.obsidian/plugins/axon/"
