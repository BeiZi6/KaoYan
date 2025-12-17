# Axon Obsidian Plugin - 安装和使用指南

## 概述

Axon 是一个集成在 Obsidian 右侧边栏的 AI Agent 插件。它不仅仅是一个聊天窗口，而是一个具备"读写能力"的 Agent，可以读取 Vault 上下文，并根据指令执行操作。

这是 MVP（最小可行产品）版本，实现了基本的交互框架。

## 功能特性

### 核心功能
- ✅ 右侧边栏视图
- ✅ 文本输入框和发送按钮
- ✅ 控制台输出显示
- ✅ 消息历史记录
- ✅ 清除控制台功能
- ✅ 快捷键支持（Ctrl+Enter 发送）
- ✅ 自动滚动到最新消息
- ✅ 响应式设计

### 🎨 UI/UX 设计
- ✅ **GitHub 设计风格** - 严格遵循 GitHub Primer Design System
- ✅ **Issue 讨论区布局** - 侧边栏看起来像 GitHub Issue 讨论区
- ✅ **消息卡片** - GitHub 评论卡片风格（带边框、圆角、阴影）
- ✅ **评论编辑器** - 输入框模仿 GitHub 评论编辑器
- ✅ **GitHub 按钮** - 绿色主按钮，灰色次要按钮
- ✅ **系统字体** - 使用 GitHub 字体栈，保持技术感
- ✅ **深色模式** - 完美适配 Obsidian 深色和浅色模式
- ✅ **动画效果** - 消息滑入动画和加载效果
- ✅ **可访问性** - 键盘导航、焦点样式、屏幕阅读器支持

## 安装步骤

### 方法一：手动安装（推荐）

#### 第一步：编译 TypeScript 文件

由于 Obsidian 需要 JavaScript 文件而不是 TypeScript 文件，你需要先编译代码：

1. **安装 Node.js**（如果尚未安装）
   - 访问 [nodejs.org](https://nodejs.org/) 下载并安装 Node.js

2. **安装 esbuild**（用于编译 TypeScript）
   ```bash
   npm install -g esbuild
   ```

3. **编译插件文件**
   ```bash
   cd /path/to/your/axon-plugin
   esbuild main.ts --bundle --outfile=main.js --platform=browser --external:obsidian
   esbuild src/core/axon-view.ts --bundle --outfile=src/core/axon-view.js --platform=browser --external:obsidian
   esbuild src/core/event-bus.ts --bundle --outfile=src/core/event-bus.js --platform=browser --external:obsidian
   esbuild src/core/types.ts --bundle --outfile=src/core/types.js --platform=browser --external:obsidian
   esbuild src/ui/input-panel.ts --bundle --outfile=src/ui/input-panel.js --platform=browser --external:obsidian
   esbuild src/ui/console-output.ts --bundle --outfile=src/ui/console-output.js --platform=browser --external:obsidian
   ```

4. **删除 TypeScript 文件**（可选）
   ```bash
   find . -name "*.ts" -delete
   ```

#### 第二步：安装到 Obsidian

1. **打开 Obsidian**

2. **找到插件目录**
   - macOS: `~/Library/Application Support/obsidian/plugins/`
   - Windows: `%APPDATA%\Obsidian\plugins\`
   - Linux: `~/.config/obsidian/plugins/`

3. **创建 Axon 插件文件夹**
   ```bash
   mkdir -p ~/.obsidian/plugins/axon
   ```

4. **复制文件到插件目录**
   ```bash
   # 复制编译后的 JS 文件、样式文件和清单文件
   cp manifest.json ~/.obsidian/plugins/axon/
   cp main.js ~/.obsidian/plugins/axon/
   cp styles.css ~/.obsidian/plugins/axon/
   cp -r src ~/.obsidian/plugins/axon/
   ```

   或者手动复制以下文件：
   - `manifest.json`
   - `main.js`（编译后的文件）
   - `styles.css`
   - 整个 `src` 文件夹（包含编译后的 JS 文件）

#### 第三步：启用插件

1. 在 Obsidian 中，打开 `设置`（Settings）

2. 点击左侧的 `第三方插件`（Community plugins）

3. 关闭 `安全模式`（如果尚未关闭）

4. 找到 `Axon` 插件并点击 `启用`

### 方法二：使用开发模式

如果你想进行开发或调试：

1. **开启开发者模式**
   - 在 Obsidian 设置中，开启 `第三方插件` → `开发者模式`

2. **加载插件**
   - 在设置中，点击 `第三方插件` → `加载插件`（Load plugin）
   - 选择 `axon-plugin` 文件夹

## 使用方法

### 打开 Axon 控制台

有三种方式：

1. **点击右侧边栏图标**
   - 在 Obsidian 右侧边栏找到终端图标 🟦，点击即可打开

2. **使用命令面板**
   - 按 `Cmd+P`（Mac）或 `Ctrl+P`（Windows/Linux）
   - 输入 "Axon"
   - 选择 "打开 Axon 控制台"

3. **使用快捷键**
   - 按 `Cmd+Shift+A`（Mac）或 `Ctrl+Shift+A`（Windows/Linux）

### 发送消息

1. 在文本框中输入消息
2. 点击 `发送` 按钮 或 按 `Ctrl+Enter`（Mac: `Cmd+Enter`）
3. Axon 会显示 "Axon is listening: [您的消息]"

### 清除控制台

- 点击控制台右上角的 `清除` 按钮

## 文件结构

```
axon-plugin/
├── manifest.json          # 插件清单文件
├── main.js               # 编译后的主入口文件
├── styles.css            # 样式文件
└── src/
    ├── core/
    │   ├── axon-view.js     # AxonView 核心实现
    │   ├── event-bus.js     # 事件总线
    │   └── types.js         # 类型定义
    └── ui/
        ├── input-panel.js   # 输入面板组件
        └── console-output.js # 控制台输出组件
```

## 开发说明

### 重新编译

每次修改 TypeScript 文件后，需要重新编译：

```bash
esbuild main.ts --bundle --outfile=main.js --platform=browser --external:obsidian
esbuild src/core/axon-view.ts --bundle --outfile=src/core/axon-view.js --platform=browser --external:obsidian
# ... 重复其他文件
```

### 添加新功能

1. 在相应的 TypeScript 文件中添加代码
2. 重新编译
3. 在 Obsidian 中重新加载插件（设置 → 第三方插件 → 找到 Axon → 重新加载）

## 故障排除

### 插件无法加载

1. 检查文件路径是否正确
2. 确认所有必需文件都已复制
3. 查看 Obsidian 控制台（开发者工具）中的错误信息

### 编译错误

1. 确保安装了 Node.js 和 esbuild
2. 检查 TypeScript 语法错误
3. 确保 Obsidian API 正确导入

### 界面显示异常

1. 清除浏览器缓存
2. 重新启用插件
3. 检查 styles.css 是否正确加载

## 已知问题

- MVP 版本仅显示模拟响应
- 尚未连接到实际的 AI 服务
- 没有设置面板

## 下一步计划

- [ ] 集成真实的 AI 服务（OpenAI API、Claude API 等）
- [ ] 添加设置面板
- [ ] 实现文件读写功能
- [ ] 添加上下文感知能力
- [ ] 支持 Markdown 渲染
- [ ] 添加命令面板集成
- [ ] 实现主题支持

## UI/UX 设计规范

### GitHub Design System
本插件采用 **GitHub Primer Design System**，提供一致、专业的用户体验：

#### 设计特点
- 🎨 **颜色系统** - 严格遵循 GitHub 官方颜色规范
- 📱 **深色模式** - 完美适配深色和浅色主题
- 💬 **消息卡片** - 类似 GitHub Issue 评论的卡片设计
- ⌨️ **编辑器** - GitHub 评论编辑器风格
- 🔘 **按钮** - GitHub 经典按钮样式（绿色主按钮）
- 🔤 **字体** - GitHub 字体栈，保持技术感
- ✨ **动画** - 微妙的过渡动画和加载效果

#### 详细文档
- 📘 **[UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)** - 完整的 UI/UX 设计规范
  - 颜色系统详解
  - 字体和间距规范
  - 组件设计指南
  - 深色模式适配
  - 可访问性标准

#### 界面预览
```
┌─────────────────────────────────┐
│  Axon Console    [清除]          │ ← GitHub Issue Header 风格
├─────────────────────────────────┤
│                                 │
│  [用户]    14:32:15              │ ← GitHub 卡片样式
│  这是我的消息...                 │
│                                 │
│  [Axon]    14:32:16              │
│  Axon is listening: 这是我的消息  │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  ┌─────────────────────────────┐  │ ← GitHub 评论编辑器
│  │ 输入您的消息...               │  │
│  │                             │  │
│  └─────────────────────────────┘  │
│                    [发送]        │ ← GitHub 绿色按钮
└─────────────────────────────────┘
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 邮箱：your.email@example.com

---

**注意**：这是一个 MVP 版本，仅用于演示核心概念。完整的 AI Agent 功能将在后续版本中实现。
