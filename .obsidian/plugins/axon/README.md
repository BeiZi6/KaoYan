# Axon - Obsidian AI Agent Plugin

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/obsidian-1.0+-purple.svg" alt="Obsidian">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</p>

## 🚀 概述

Axon 是一个集成在 Obsidian 中的 **AI Agent 插件**，具备类似 Claude Code/Cursor 的 **MCP (Model Context Protocol)** 功能。它不仅仅是一个聊天窗口，而是一个能够**自主读写整个 Vault** 的智能代理。

### ✨ 核心特性

- 🔓 **Agent Mode** - AI 可以自主访问和操作整个 Vault
- 📖 **read_note** - 读取任意路径的笔记内容
- ✏️ **create_note** - 创建或更新笔记（支持覆盖/追加模式）
- 📁 **list_folder** - 探索目录结构
- 🔄 **自动执行循环** - AI 自动调用工具，无需手动触发
- ⚡ **Tool Output 卡片** - 实时显示工具执行结果

## 📦 安装

### 方法一：手动安装

1. 下载最新 Release
2. 解压到 Obsidian 插件目录：
   - macOS: `~/.obsidian/plugins/axon/`
   - Windows: `%APPDATA%\Obsidian\plugins\axon\`
   - Linux: `~/.config/obsidian/plugins/axon/`
3. 重启 Obsidian
4. 在设置中启用 Axon 插件

### 方法二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/your-username/axon-obsidian-plugin.git
cd axon-obsidian-plugin

# 安装依赖
npm install

# 构建
npm run build

# 复制到 Obsidian 插件目录
cp main.js manifest.json styles.css ~/.obsidian/plugins/axon/
```

## ⚙️ 配置

1. 打开 Obsidian 设置 → Axon
2. 输入你的 **DeepSeek API Key**
3. （可选）选择模型名称

## 🎯 使用方法

### 打开 Axon 控制台

- 点击右侧边栏的终端图标 🟦
- 或使用命令面板：`Cmd/Ctrl + P` → "打开 Axon 控制台"

### Agent Mode 示例

**创建笔记：**
```
用户: 在 Diary 文件夹下创建一个 2025-Plan.md 文件，内容是新年计划模板
```
Axon 会自动调用 `create_note` 工具完成创建。

**读取笔记：**
```
用户: 读取 Projects/README.md 的内容并总结
```
Axon 会调用 `read_note` 读取文件，然后生成总结。

**探索目录：**
```
用户: 列出 Daily 文件夹下的所有文件
```
Axon 会调用 `list_folder` 返回文件列表。

### 工具调用格式

AI 使用 `json:tool` 代码块调用工具：

```json:tool
{
  "tool": "create_note",
  "params": {
    "path": "Diary/2025-Plan.md",
    "content": "# 2025 年计划\n\n## 目标\n\n- [ ] 目标1"
  }
}
```

### 可用命令

- `/help` - 显示帮助
- `/analyze` - 分析当前文件
- `/clear` - 清除控制台
- `/settings` - 打开设置

## 🏗️ 架构

```
src/
├── core/
│   ├── axon-view.ts        # 主视图组件
│   ├── deepseek-service.ts # AI API 服务
│   ├── tool-manager.ts     # 工具管理器 (MCP)
│   ├── tool-parser.ts      # 响应解析器
│   ├── execution-loop.ts   # 执行循环
│   └── ...
├── ui/
│   ├── input-panel.ts      # 输入面板
│   ├── console-output.ts   # 控制台输出
│   ├── tool-output-card.ts # 工具输出卡片
│   └── ...
└── main.ts                 # 插件入口
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- tests/tool-manager.property.ts
```

项目使用 **Vitest** + **fast-check** 进行属性测试，确保核心功能的正确性。

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test
```

## 📋 功能清单

### v2.0.0 - MCP Agent Mode
- [x] ToolManager - 工具管理器
- [x] read_note - 读取笔记
- [x] create_note - 创建/更新笔记
- [x] list_folder - 列出目录
- [x] ToolParser - 响应解析器
- [x] ExecutionLoop - 执行循环
- [x] Agent Mode UI 指示器
- [x] Tool Output 卡片
- [x] 属性测试覆盖

### v1.2.0 - Selection Mode
- [x] 选区上下文感知
- [x] 替换选区功能
- [x] 上下文模式指示器

### v1.0.0 - 基础功能
- [x] DeepSeek API 集成
- [x] 文件分析
- [x] GitHub 风格 UI
- [x] 深色/浅色模式

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Axon** - 让 AI 成为你的 Obsidian 助手 🧠
