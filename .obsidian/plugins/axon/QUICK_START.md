# Axon Plugin - 快速入门指南

## 🚀 5分钟快速安装

### 第一步：编译 TypeScript（2分钟）

```bash
# 安装 esbuild（如果尚未安装）
npm install -g esbuild

# 进入插件目录
cd /path/to/axon-plugin

# 批量编译所有文件
for file in main.ts src/core/*.ts src/ui/*.ts; do
    esbuild "$file" --bundle --outfile="${file%.ts}.js" --platform=browser --external:obsidian
done

# 删除 ts 文件（可选）
find . -name "*.ts" -delete
```

### 第二步：复制到 Obsidian（1分钟）

```bash
# 创建插件目录（如果不存在）
mkdir -p ~/.obsidian/plugins/axon

# 复制所有必要文件
cp manifest.json ~/.obsidian/plugins/axon/
cp main.js ~/.obsidian/plugins/axon/
cp styles.css ~/.obsidian/plugins/axon/
cp -r src ~/.obsidian/plugins/axon/
```

### 第三步：启用插件（2分钟）

1. 打开 Obsidian
2. 设置 → 第三方插件 → 关闭安全模式
3. 找到 "Axon" 并点击 "启用"

## ✅ 验证安装

1. 点击右侧边栏的终端图标 🟦
2. 输入 "Hello World"
3. 点击发送
4. 应该看到 "Axon is listening: Hello World"

## 📝 常用命令

### 编译单个文件
```bash
esbuild main.ts --bundle --outfile=main.js --platform=browser --external:obsidian
```

### 重新编译所有文件
```bash
./rebuild.sh
```

### 检查文件结构
```bash
ls -la ~/.obsidian/plugins/axon/
```

## 🔧 故障排除

### 问题：插件不显示
**解决方案**：
```bash
# 检查文件是否存在
ls -la ~/.obsidian/plugins/axon/

# 检查 manifest.json 是否正确
cat ~/.obsidian/plugins/axon/manifest.json
```

### 问题：编译失败
**解决方案**：
```bash
# 重新安装 esbuild
npm uninstall -g esbuild
npm install -g esbuild@latest

# 手动编译每个文件
esbuild main.ts --bundle --outfile=main.js --platform=browser --external:obsidian
```

### 问题：界面显示异常
**解决方案**：
1. 关闭并重新打开 Obsidian
2. 禁用并重新启用插件
3. 检查控制台错误：设置 → 关于 → 查看日志

## 📚 更多资源

- [完整安装指南](./README.md)
- [Obsidian 插件开发文档](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [API 参考](https://docs.obsidian.md/Plugins/References)

---

**需要帮助？** 查看 [README.md](./README.md) 获取详细说明。
