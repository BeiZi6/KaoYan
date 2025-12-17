"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => AxonPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian9 = require("obsidian");

// src/core/axon-view.ts
var import_obsidian7 = require("obsidian");

// src/core/event-bus.ts
var SimpleEventBus = class {
  constructor() {
    this.events = /* @__PURE__ */ new Map();
  }
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }
  off(event, callback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  emit(event, data) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
  clear() {
    this.events.clear();
  }
};

// src/core/file-analyzer.ts
var import_obsidian = require("obsidian");
var FileAnalyzer = class {
  constructor(app) {
    this.app = app;
  }
  /**
   * 分析当前活动文件
   */
  async analyzeCurrentFile() {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!activeView || !activeView.file) {
      return null;
    }
    return this.analyzeFile(activeView.file);
  }
  /**
   * 分析指定文件
   */
  async analyzeFile(file) {
    const content = await this.app.vault.read(file);
    const cache = this.app.metadataCache.getFileCache(file);
    const headings = this.extractHeadings(content);
    const wordCount = this.countWords(content);
    const links = this.extractLinks(content, cache);
    const frontmatter = this.parseFrontmatter(cache);
    const isEmpty = content.trim().length === 0;
    const lastModified = new Date(file.stat.mtime).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    return {
      file: {
        name: file.name,
        path: file.path,
        size: file.stat.size
      },
      stats: {
        wordCount,
        characterCount: content.length,
        lineCount: content.split("\n").length,
        lastModified
      },
      structure: {
        headings,
        headingCount: headings.length
      },
      links,
      frontmatter,
      analyzedAt: /* @__PURE__ */ new Date(),
      isEmpty
    };
  }
  /**
   * 提取标题信息
   * Property 2: Heading Extraction Accuracy
   */
  extractHeadings(content) {
    const headings = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          position: i + 1
        });
      }
    }
    return headings;
  }
  /**
   * 统计字数
   * Property 3: Word Count Consistency
   */
  countWords(content) {
    const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, "");
    const cleanContent = contentWithoutFrontmatter.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/!\[([^\]]*)\]\([^)]+\)/g, "").replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1").replace(/[#*_~>`]/g, "").replace(/\n+/g, " ").trim();
    if (!cleanContent)
      return 0;
    const words = cleanContent.split(/\s+/).filter((word) => word.length > 0);
    return words.length;
  }
  /**
   * 提取链接
   * Property 4: Link Extraction Completeness
   */
  extractLinks(content, cache) {
    const internal = [];
    const external = [];
    const wikiLinkRegex = /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g;
    let match;
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      internal.push(match[1]);
    }
    const urlRegex = /https?:\/\/[^\s\)>\]]+/g;
    while ((match = urlRegex.exec(content)) !== null) {
      external.push(match[0]);
    }
    return {
      internal,
      external,
      internalCount: internal.length,
      externalCount: external.length
    };
  }
  /**
   * 解析 Frontmatter
   * Property 5: Frontmatter Parsing Round-Trip
   */
  parseFrontmatter(cache) {
    if (!cache || !cache.frontmatter) {
      return null;
    }
    try {
      const { position, ...frontmatterData } = cache.frontmatter;
      return frontmatterData;
    } catch (error) {
      console.warn("Failed to parse frontmatter:", error);
      return null;
    }
  }
  /**
   * 检查文件是否为 Markdown
   */
  isMarkdownFile(file) {
    return file.extension === "md";
  }
};

// src/core/file-context.ts
var import_obsidian2 = require("obsidian");
var FileContext = class {
  constructor(app) {
    this._currentFile = null;
    this.callbacks = [];
    this.eventRef = null;
    this.app = app;
  }
  /** 获取当前文件 */
  get currentFile() {
    return this._currentFile;
  }
  /** 开始监听文件变化 */
  startWatching() {
    this.updateCurrentFile();
    this.eventRef = this.app.workspace.on("active-leaf-change", (leaf) => {
      this.handleLeafChange(leaf);
    });
  }
  /** 停止监听 */
  stopWatching() {
    if (this.eventRef) {
      this.app.workspace.offref(this.eventRef);
      this.eventRef = null;
    }
  }
  /** 注册文件变化回调 */
  onFileChange(callback) {
    this.callbacks.push(callback);
  }
  /** 移除回调 */
  offFileChange(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
  /** 清除所有回调 */
  clearCallbacks() {
    this.callbacks = [];
  }
  /** 处理叶子变化 */
  handleLeafChange(leaf) {
    const previousFile = this._currentFile;
    this.updateCurrentFile();
    if (this._currentFile?.path !== previousFile?.path) {
      this.notifyCallbacks(previousFile);
    }
  }
  /** 更新当前文件引用 */
  updateCurrentFile() {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
    this._currentFile = activeView?.file || null;
  }
  /** 通知所有回调 */
  notifyCallbacks(previousFile) {
    const eventData = {
      file: this._currentFile ? {
        name: this._currentFile.name,
        path: this._currentFile.path
      } : null,
      previousFile: previousFile ? {
        name: previousFile.name,
        path: previousFile.path
      } : null
    };
    this.callbacks.forEach((callback) => {
      try {
        callback(eventData);
      } catch (error) {
        console.error("FileContext callback error:", error);
      }
    });
  }
};

// src/core/deepseek-service.ts
var import_obsidian3 = require("obsidian");
var DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
var SYSTEM_PROMPT = `\u4F60\u662F\u4E00\u4E2A\u96C6\u6210\u5728 Obsidian \u4E2D\u7684\u667A\u80FD\u52A9\u624B Axon\u3002\u4F60\u53EF\u4EE5\u8BFB\u53D6\u7528\u6237\u7684\u7B14\u8BB0\u3002\u8BF7\u7528\u7B80\u6D01\u3001\u4E13\u4E1A\u7684 Markdown \u683C\u5F0F\u56DE\u7B54\u3002`;
var DeepSeekService = class {
  constructor(app, getSettings) {
    this.app = app;
    this.getSettings = getSettings;
  }
  /** 构建 Agent Mode 的 System Prompt（包含工具定义） */
  buildAgentSystemPrompt(toolDefinitions) {
    const toolSchemas = toolDefinitions.map((tool) => {
      return `### ${tool.name}
${tool.description}

Parameters:
\`\`\`json
${JSON.stringify(tool.parameters, null, 2)}
\`\`\``;
    }).join("\n\n");
    return `\u4F60\u662F Axon\uFF0C\u4E00\u4E2A\u96C6\u6210\u5728 Obsidian \u4E2D\u7684\u667A\u80FD\u52A9\u624B\u3002\u4F60\u62E5\u6709 Agent Mode \u6743\u9650\uFF0C\u53EF\u4EE5\u8BFB\u53D6\u3001\u521B\u5EFA\u548C\u7BA1\u7406\u7528\u6237 Vault \u4E2D\u7684\u4EFB\u4F55\u7B14\u8BB0\u3002

## \u53EF\u7528\u5DE5\u5177

${toolSchemas}

## \u5DE5\u5177\u4F7F\u7528\u89C4\u5219

1. \u5F53\u4F60\u9700\u8981\u6267\u884C\u6587\u4EF6\u64CD\u4F5C\u65F6\uFF0C\u4F7F\u7528 \`\`\`json:tool \u4EE3\u7801\u5757\u8F93\u51FA\u5DE5\u5177\u8C03\u7528
2. \u5DE5\u5177\u8C03\u7528\u683C\u5F0F\u5FC5\u987B\u4E25\u683C\u9075\u5FAA\u4EE5\u4E0B JSON \u7ED3\u6784\uFF1A

\`\`\`json:tool
{
  "tool": "\u5DE5\u5177\u540D\u79F0",
  "params": {
    "\u53C2\u6570\u540D": "\u53C2\u6570\u503C"
  }
}
\`\`\`

3. \u4F60\u53EF\u4EE5\u5728\u4E00\u6B21\u56DE\u590D\u4E2D\u8C03\u7528\u591A\u4E2A\u5DE5\u5177\uFF0C\u6BCF\u4E2A\u5DE5\u5177\u4F7F\u7528\u5355\u72EC\u7684 \`\`\`json:tool \u4EE3\u7801\u5757
4. \u5DE5\u5177\u6267\u884C\u7ED3\u679C\u4F1A\u81EA\u52A8\u8FD4\u56DE\u7ED9\u4F60\uFF0C\u4F60\u53EF\u4EE5\u6839\u636E\u7ED3\u679C\u7EE7\u7EED\u5BF9\u8BDD
5. \u5982\u679C\u4E0D\u9700\u8981\u6267\u884C\u5DE5\u5177\u64CD\u4F5C\uFF0C\u76F4\u63A5\u7528\u666E\u901A\u6587\u672C\u56DE\u590D\u7528\u6237

## \u793A\u4F8B

\u7528\u6237: "\u5728 Diary \u6587\u4EF6\u5939\u4E0B\u521B\u5EFA\u4E00\u4E2A 2025-Plan.md \u6587\u4EF6"

\u4F60\u7684\u56DE\u590D:
\u597D\u7684\uFF0C\u6211\u6765\u4E3A\u4F60\u521B\u5EFA\u8FD9\u4E2A\u6587\u4EF6\u3002

\`\`\`json:tool
{
  "tool": "create_note",
  "params": {
    "path": "Diary/2025-Plan.md",
    "content": "# 2025 \u5E74\u8BA1\u5212\\n\\n## \u76EE\u6807\\n\\n- [ ] \u76EE\u68071\\n- [ ] \u76EE\u68072\\n\\n## \u884C\u52A8\u8BA1\u5212\\n\\n\u5F85\u8865\u5145..."
  }
}
\`\`\`

## \u6CE8\u610F\u4E8B\u9879

- \u8DEF\u5F84\u76F8\u5BF9\u4E8E Vault \u6839\u76EE\u5F55
- \u6587\u4EF6\u8DEF\u5F84\u4F1A\u81EA\u52A8\u6DFB\u52A0 .md \u6269\u5C55\u540D
- \u521B\u5EFA\u6587\u4EF6\u65F6\u4F1A\u81EA\u52A8\u521B\u5EFA\u4E0D\u5B58\u5728\u7684\u7236\u6587\u4EF6\u5939
- \u8BF7\u7528\u7B80\u6D01\u3001\u4E13\u4E1A\u7684 Markdown \u683C\u5F0F\u56DE\u7B54\u7528\u6237\u95EE\u9898`;
  }
  /** 检查是否已配置 API Key */
  isConfigured() {
    const settings = this.getSettings();
    return !!settings.apiKey && settings.apiKey.trim().length > 0;
  }
  /** 构建带上下文的用户消息 (全文模式) */
  buildUserMessage(userQuestion, fileContext) {
    if (fileContext && fileContext.trim().length > 0) {
      return `Context from active note:

${fileContext}

User Question: ${userQuestion}`;
    }
    return userQuestion;
  }
  /** 构建选区模式的用户消息 */
  buildSelectionMessage(userInstruction, selectedText) {
    return `Selected Text:

${selectedText}

User Instruction: ${userInstruction}`;
  }
  /** 构建请求消息数组 */
  buildMessages(userMessage, fileContext) {
    return [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: this.buildUserMessage(userMessage, fileContext) }
    ];
  }
  /** 发送聊天请求 */
  async chat(userMessage, fileContext) {
    const settings = this.getSettings();
    if (!this.isConfigured()) {
      throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E DeepSeek API Key");
    }
    const messages = this.buildMessages(userMessage, fileContext);
    const requestBody = {
      model: settings.modelName || "deepseek-chat",
      messages,
      stream: false
    };
    try {
      const response = await (0, import_obsidian3.requestUrl)({
        url: DEEPSEEK_API_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      if (response.status !== 200) {
        console.error("DeepSeek API error:", response);
        throw new Error(`API \u8BF7\u6C42\u5931\u8D25: ${response.status}`);
      }
      const data = response.json;
      if (!data.choices || data.choices.length === 0) {
        throw new Error("AI \u672A\u8FD4\u56DE\u6709\u6548\u54CD\u5E94");
      }
      return data.choices[0].message.content;
    } catch (error) {
      console.error("DeepSeek service error:", error);
      if (error instanceof Error) {
        if (error.message.includes("API Key")) {
          throw error;
        }
        if (error.message.includes("net::")) {
          throw new Error("\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC");
        }
        if (error.message.includes("401")) {
          throw new Error("API Key \u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E");
        }
        if (error.message.includes("429")) {
          throw new Error("\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
        }
      }
      throw new Error("AI \u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    }
  }
  /** 支持多轮对话的聊天方法（用于 Agent Mode） */
  async chatWithHistory(messages) {
    const settings = this.getSettings();
    if (!this.isConfigured()) {
      throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E DeepSeek API Key");
    }
    const requestBody = {
      model: settings.modelName || "deepseek-chat",
      messages,
      stream: false
    };
    try {
      const response = await (0, import_obsidian3.requestUrl)({
        url: DEEPSEEK_API_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      if (response.status !== 200) {
        console.error("DeepSeek API error:", response);
        throw new Error(`API \u8BF7\u6C42\u5931\u8D25: ${response.status}`);
      }
      const data = response.json;
      if (!data.choices || data.choices.length === 0) {
        throw new Error("AI \u672A\u8FD4\u56DE\u6709\u6548\u54CD\u5E94");
      }
      return data.choices[0].message.content;
    } catch (error) {
      console.error("DeepSeek service error:", error);
      if (error instanceof Error) {
        if (error.message.includes("API Key")) {
          throw error;
        }
        if (error.message.includes("net::")) {
          throw new Error("\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC");
        }
        if (error.message.includes("401")) {
          throw new Error("API Key \u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E");
        }
        if (error.message.includes("429")) {
          throw new Error("\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
        }
      }
      throw new Error("AI \u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    }
  }
};

// src/core/file-operations.ts
var import_obsidian4 = require("obsidian");
var FileOperations = class {
  constructor(app) {
    this.app = app;
  }
  /** 获取当前活动文件 */
  getActiveFile() {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (activeView && activeView.file) {
      return activeView.file;
    }
    return this.app.workspace.getActiveFile();
  }
  /** 追加内容到当前文件 */
  async appendToCurrentFile(content) {
    const file = this.getActiveFile();
    if (!file) {
      throw new Error("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0\u6587\u4EF6");
    }
    if (file.extension !== "md") {
      throw new Error("\u53EA\u80FD\u8FFD\u52A0\u5230 Markdown \u6587\u4EF6");
    }
    try {
      const currentContent = await this.app.vault.read(file);
      const separator = "\n\n---\n\n## Axon AI \u56DE\u590D\n\n";
      const newContent = currentContent + separator + content + "\n";
      await this.app.vault.modify(file, newContent);
      new import_obsidian4.Notice("\u2705 \u5DF2\u8FFD\u52A0\u5230\u5F53\u524D\u7B14\u8BB0");
    } catch (error) {
      console.error("File append error:", error);
      throw new Error("\u6587\u4EF6\u5199\u5165\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
    }
  }
  /** 创建聊天笔记 */
  async createChatNote(conversation) {
    const timestamp = this.formatTimestamp(conversation.timestamp);
    const fileName = `Axon-Chat-${timestamp}.md`;
    const content = this.formatConversation(conversation);
    try {
      const existingFile = this.app.vault.getAbstractFileByPath(fileName);
      if (existingFile) {
        const uniqueFileName = `Axon-Chat-${timestamp}-${Math.random().toString(36).substr(2, 4)}.md`;
        const file2 = await this.app.vault.create(uniqueFileName, content);
        new import_obsidian4.Notice(`\u2705 \u5DF2\u4FDD\u5B58\u5230 ${uniqueFileName}`);
        return file2;
      }
      const file = await this.app.vault.create(fileName, content);
      new import_obsidian4.Notice(`\u2705 \u5DF2\u4FDD\u5B58\u5230 ${fileName}`);
      return file;
    } catch (error) {
      console.error("File creation error:", error);
      throw new Error("\u521B\u5EFA\u7B14\u8BB0\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
    }
  }
  /** 获取当前选区 */
  getCurrentSelection() {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (!activeView || !activeView.editor) {
      return null;
    }
    const selection = activeView.editor.getSelection();
    return selection && selection.trim().length > 0 ? selection : null;
  }
  /** 检查是否有选区 */
  hasSelection() {
    return this.getCurrentSelection() !== null;
  }
  /** 替换选区内容 */
  async replaceSelection(content, originalSelection) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (!activeView || !activeView.editor) {
      throw new Error("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0\u6587\u4EF6");
    }
    const editor = activeView.editor;
    const currentSelection = editor.getSelection();
    if (!currentSelection || currentSelection.trim().length === 0) {
      throw new Error("\u9009\u533A\u5DF2\u4E22\u5931\uFF0C\u65E0\u6CD5\u66FF\u6362");
    }
    if (currentSelection !== originalSelection) {
      throw new Error("\u9009\u533A\u5185\u5BB9\u5DF2\u66F4\u6539\uFF0C\u65E0\u6CD5\u66FF\u6362");
    }
    try {
      editor.replaceSelection(content);
      new import_obsidian4.Notice("\u2705 \u5DF2\u66FF\u6362\u9009\u4E2D\u5185\u5BB9");
    } catch (error) {
      console.error("Replace selection error:", error);
      throw new Error("\u66FF\u6362\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
    }
  }
  /** 格式化时间戳 */
  formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }
  /** 格式化对话内容 */
  formatConversation(conversation) {
    const lines = [
      "---",
      "tags: [axon-chat]",
      `date: ${conversation.timestamp.toISOString()}`,
      "---",
      "",
      "# Axon \u5BF9\u8BDD\u8BB0\u5F55",
      "",
      `> \u521B\u5EFA\u65F6\u95F4: ${conversation.timestamp.toLocaleString("zh-CN")}`,
      ""
    ];
    if (conversation.context) {
      lines.push("## \u7B14\u8BB0\u4E0A\u4E0B\u6587");
      lines.push("");
      lines.push("```");
      lines.push(conversation.context.substring(0, 500) + (conversation.context.length > 500 ? "..." : ""));
      lines.push("```");
      lines.push("");
    }
    lines.push("## \u7528\u6237\u95EE\u9898");
    lines.push("");
    lines.push(conversation.userMessage);
    lines.push("");
    lines.push("## Axon \u56DE\u590D");
    lines.push("");
    lines.push(conversation.aiResponse);
    lines.push("");
    return lines.join("\n");
  }
};

// src/core/selection-context.ts
var import_obsidian5 = require("obsidian");
var SelectionContext = class {
  constructor(app) {
    this.updateCallbacks = [];
    this.app = app;
    this._state = {
      mode: "noFile",
      selectedText: null,
      originalSelection: null,
      timestamp: Date.now()
    };
  }
  /** 获取当前状态 */
  get state() {
    return { ...this._state };
  }
  /** 获取当前模式 */
  get mode() {
    return this._state.mode;
  }
  /** 获取选中的文本 */
  get selectedText() {
    return this._state.selectedText;
  }
  /** 更新选区状态 */
  updateState() {
    const editor = this.getActiveEditor();
    if (!editor) {
      this._state = {
        mode: "noFile",
        selectedText: null,
        originalSelection: null,
        timestamp: Date.now()
      };
    } else {
      const selection = editor.getSelection();
      if (selection && selection.trim().length > 0) {
        this._state = {
          mode: "selection",
          selectedText: selection,
          originalSelection: selection,
          timestamp: Date.now()
        };
      } else {
        this._state = {
          mode: "fullNote",
          selectedText: null,
          originalSelection: null,
          timestamp: Date.now()
        };
      }
    }
    this.notifyCallbacks();
  }
  /** 检查是否有有效选区 */
  hasValidSelection() {
    return this._state.mode === "selection" && this._state.selectedText !== null && this._state.selectedText.trim().length > 0;
  }
  /** 获取 AI 请求的上下文 */
  getContextForAI() {
    if (this._state.mode === "selection" && this._state.selectedText) {
      return this._state.selectedText;
    }
    return void 0;
  }
  /** 验证当前选区是否与原始选区匹配 */
  validateSelection(originalSelection) {
    const editor = this.getActiveEditor();
    if (!editor)
      return false;
    const currentSelection = editor.getSelection();
    return currentSelection === originalSelection;
  }
  /** 获取活动编辑器 */
  getActiveEditor() {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    return activeView?.editor || null;
  }
  /** 注册状态更新回调 */
  onStateChange(callback) {
    this.updateCallbacks.push(callback);
  }
  /** 移除回调 */
  offStateChange(callback) {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }
  /** 清除所有回调 */
  clearCallbacks() {
    this.updateCallbacks = [];
  }
  /** 通知所有回调 */
  notifyCallbacks() {
    const state = this.state;
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error("SelectionContext callback error:", error);
      }
    });
  }
  /** 获取模式显示文本 */
  static getModeDisplayText(mode) {
    switch (mode) {
      case "selection":
        return "\u{1F50D} Focused on Selection";
      case "fullNote":
        return "\u{1F4C4} Full Note Context";
      case "noFile":
        return "\u26A0\uFE0F No file open";
    }
  }
};

// src/core/tool-manager.ts
var import_obsidian6 = require("obsidian");
var INVALID_PATH_CHARS = /[<>:"|?*]/;
var ToolManager = class {
  constructor(app) {
    this.app = app;
  }
  /** 获取所有工具定义（用于 System Prompt） */
  getToolDefinitions() {
    return [
      {
        name: "read_note",
        description: "\u8BFB\u53D6\u6307\u5B9A\u8DEF\u5F84\u7684 Markdown \u7B14\u8BB0\u5185\u5BB9\u3002\u8DEF\u5F84\u76F8\u5BF9\u4E8E Vault \u6839\u76EE\u5F55\u3002",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: '\u7B14\u8BB0\u6587\u4EF6\u8DEF\u5F84\uFF0C\u4F8B\u5982 "Daily/2025-01-15.md" \u6216 "Ideas/project"\uFF08\u4F1A\u81EA\u52A8\u6DFB\u52A0 .md \u6269\u5C55\u540D\uFF09'
            }
          },
          required: ["path"]
        }
      },
      {
        name: "create_note",
        description: "\u5728\u6307\u5B9A\u8DEF\u5F84\u521B\u5EFA\u6216\u66F4\u65B0\u7B14\u8BB0\u3002\u5982\u679C\u7236\u6587\u4EF6\u5939\u4E0D\u5B58\u5728\u4F1A\u81EA\u52A8\u521B\u5EFA\u3002",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: '\u7B14\u8BB0\u6587\u4EF6\u8DEF\u5F84\uFF0C\u4F8B\u5982 "Diary/2025-Plan.md"'
            },
            content: {
              type: "string",
              description: "\u7B14\u8BB0\u5185\u5BB9\uFF08Markdown \u683C\u5F0F\uFF09"
            },
            mode: {
              type: "string",
              description: "\u5199\u5165\u6A21\u5F0F\uFF1Aoverwrite\uFF08\u8986\u76D6\uFF0C\u9ED8\u8BA4\uFF09\u6216 append\uFF08\u8FFD\u52A0\uFF09",
              enum: ["overwrite", "append"]
            }
          },
          required: ["path", "content"]
        }
      },
      {
        name: "list_folder",
        description: "\u5217\u51FA\u6307\u5B9A\u6587\u4EF6\u5939\u4E0B\u7684\u6240\u6709\u6587\u4EF6\u548C\u5B50\u6587\u4EF6\u5939\u3002",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: '\u6587\u4EF6\u5939\u8DEF\u5F84\uFF0C\u7A7A\u5B57\u7B26\u4E32\u6216 "/" \u8868\u793A\u6839\u76EE\u5F55'
            }
          },
          required: ["path"]
        }
      }
    ];
  }
  /** 执行工具调用 */
  async execute(toolCall) {
    const validationError = this.validateParams(toolCall);
    if (validationError) {
      return { success: false, error: validationError };
    }
    const { tool, params } = toolCall;
    switch (tool) {
      case "read_note":
        return this.readNote(params.path);
      case "create_note":
        return this.createNote(
          params.path,
          params.content,
          params.mode || "overwrite"
        );
      case "list_folder":
        return this.listFolder(params.path);
      default:
        return { success: false, error: `Tool not found: ${tool}` };
    }
  }
  /** 验证工具调用参数 */
  validateParams(toolCall) {
    const { tool, params } = toolCall;
    const definitions = this.getToolDefinitions();
    const def = definitions.find((d) => d.name === tool);
    if (!def) {
      return `Unknown tool: ${tool}`;
    }
    for (const required of def.parameters.required) {
      if (!(required in params) || params[required] === void 0 || params[required] === null) {
        return `Missing required parameter: ${required}`;
      }
    }
    for (const [key, value] of Object.entries(params)) {
      const propDef = def.parameters.properties[key];
      if (!propDef)
        continue;
      if (propDef.type === "string" && typeof value !== "string") {
        return `Parameter '${key}' must be a string`;
      }
      if (propDef.enum && !propDef.enum.includes(value)) {
        return `Parameter '${key}' must be one of: ${propDef.enum.join(", ")}`;
      }
    }
    return null;
  }
  /** 规范化路径 - 自动添加 .md 扩展名 */
  normalizePath(path) {
    if (!path || path.trim().length === 0) {
      return "";
    }
    let normalized = path.trim();
    if (normalized.startsWith("/")) {
      normalized = normalized.slice(1);
    }
    if (!normalized.toLowerCase().endsWith(".md")) {
      normalized = normalized + ".md";
    }
    return normalized;
  }
  /** 验证路径是否包含非法字符 */
  isValidPath(path) {
    return !INVALID_PATH_CHARS.test(path);
  }
  /** 读取笔记内容 */
  async readNote(path) {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) {
      return { success: false, error: "Path cannot be empty" };
    }
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (!file) {
      return { success: false, error: `File not found: ${normalizedPath}` };
    }
    if (!(file instanceof import_obsidian6.TFile)) {
      return { success: false, error: `Path is not a file: ${normalizedPath}` };
    }
    try {
      const content = await this.app.vault.read(file);
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: `Failed to read file: ${error.message}` };
    }
  }
  /** 创建或更新笔记 */
  async createNote(path, content, mode = "overwrite") {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) {
      return { success: false, error: "Path cannot be empty" };
    }
    if (!this.isValidPath(normalizedPath)) {
      return { success: false, error: `Invalid path: contains illegal characters (<>:"|?*)` };
    }
    try {
      const folderPath = normalizedPath.substring(0, normalizedPath.lastIndexOf("/"));
      if (folderPath) {
        await this.ensureFolderExists(folderPath);
      }
      const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath);
      if (existingFile && existingFile instanceof import_obsidian6.TFile) {
        if (mode === "append") {
          const currentContent = await this.app.vault.read(existingFile);
          const newContent = currentContent + "\n" + content;
          await this.app.vault.modify(existingFile, newContent);
          return { success: true, data: `Content appended to: ${normalizedPath}` };
        } else {
          await this.app.vault.modify(existingFile, content);
          return { success: true, data: `File overwritten: ${normalizedPath}` };
        }
      } else {
        await this.app.vault.create(normalizedPath, content);
        return { success: true, data: `File created: ${normalizedPath}` };
      }
    } catch (error) {
      return { success: false, error: `Failed to write file: ${error.message}` };
    }
  }
  /** 确保文件夹存在，如果不存在则创建 */
  async ensureFolderExists(folderPath) {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }
  /** 列出文件夹内容 */
  async listFolder(path) {
    let normalizedPath = path.trim();
    if (normalizedPath === "/" || normalizedPath === "") {
      normalizedPath = "";
    } else if (normalizedPath.startsWith("/")) {
      normalizedPath = normalizedPath.slice(1);
    }
    if (normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    const items = [];
    if (normalizedPath === "") {
      const rootFiles = this.app.vault.getRoot().children;
      for (const file of rootFiles) {
        items.push({
          name: file.name,
          type: file instanceof import_obsidian6.TFolder ? "folder" : "file"
        });
      }
    } else {
      const folder = this.app.vault.getAbstractFileByPath(normalizedPath);
      if (!folder) {
        return { success: false, error: `Folder not found: ${normalizedPath}` };
      }
      if (!(folder instanceof import_obsidian6.TFolder)) {
        return { success: false, error: `Path is not a folder: ${normalizedPath}` };
      }
      for (const file of folder.children) {
        items.push({
          name: file.name,
          type: file instanceof import_obsidian6.TFolder ? "folder" : "file"
        });
      }
    }
    const output = items.map((item) => `${item.type === "folder" ? "\u{1F4C1}" : "\u{1F4C4}"} ${item.name}`).join("\n");
    return {
      success: true,
      data: items.length > 0 ? output : "(empty folder)"
    };
  }
};

// src/core/tool-parser.ts
var _ToolParser = class _ToolParser {
  /**
   * 解析 AI 响应，提取文本内容和工具调用
   */
  parse(response) {
    const toolBlocks = this.extractToolBlocks(response);
    const toolCalls = [];
    const errors = [];
    for (const block of toolBlocks) {
      const result = this.parseToolBlock(block.jsonContent);
      if (result.success && result.toolCall) {
        toolCalls.push(result.toolCall);
      } else if (result.error) {
        errors.push({
          ...result.error,
          rawBlock: block.jsonContent
        });
      }
    }
    const textContent = this.extractTextContent(response, toolBlocks);
    return {
      textContent: textContent.trim(),
      toolCalls,
      hasToolCalls: toolCalls.length > 0,
      errors
    };
  }
  /**
   * 提取所有 json:tool 代码块
   */
  extractToolBlocks(response) {
    const blocks = [];
    const regex = new RegExp(_ToolParser.TOOL_BLOCK_REGEX.source, "g");
    let match;
    while ((match = regex.exec(response)) !== null) {
      blocks.push({
        fullMatch: match[0],
        jsonContent: match[1].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    return blocks;
  }
  /**
   * 解析单个工具块的 JSON 内容
   */
  parseToolBlock(jsonContent) {
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e) {
      return {
        success: false,
        error: {
          type: "malformed_json",
          message: `Invalid JSON: ${e.message}`
        }
      };
    }
    if (typeof parsed !== "object" || parsed === null) {
      return {
        success: false,
        error: {
          type: "invalid_structure",
          message: "Tool call must be an object"
        }
      };
    }
    const obj = parsed;
    if (!("tool" in obj) || typeof obj.tool !== "string") {
      return {
        success: false,
        error: {
          type: "missing_field",
          message: "Missing required field: tool"
        }
      };
    }
    if (!("params" in obj) || typeof obj.params !== "object" || obj.params === null) {
      return {
        success: false,
        error: {
          type: "missing_field",
          message: "Missing required field: params"
        }
      };
    }
    return {
      success: true,
      toolCall: {
        tool: obj.tool,
        params: obj.params
      }
    };
  }
  /**
   * 提取文本内容（移除工具块后的内容）
   */
  extractTextContent(response, blocks) {
    if (blocks.length === 0) {
      return response;
    }
    const sortedBlocks = [...blocks].sort((a, b) => a.startIndex - b.startIndex);
    let result = "";
    let lastEnd = 0;
    for (const block of sortedBlocks) {
      result += response.substring(lastEnd, block.startIndex);
      lastEnd = block.endIndex;
    }
    result += response.substring(lastEnd);
    return result;
  }
  /**
   * 验证工具调用是否有效（用于外部验证）
   */
  isValidToolCall(toolCall) {
    if (typeof toolCall !== "object" || toolCall === null) {
      return false;
    }
    const obj = toolCall;
    return typeof obj.tool === "string" && obj.tool.length > 0 && typeof obj.params === "object" && obj.params !== null;
  }
};
// 匹配 ```json:tool ... ``` 代码块的正则表达式
_ToolParser.TOOL_BLOCK_REGEX = /```json:tool\s*\n([\s\S]*?)```/g;
var ToolParser = _ToolParser;

// src/core/execution-loop.ts
var ExecutionLoop = class {
  constructor(toolManager, toolParser, aiService) {
    this.toolManager = toolManager;
    this.toolParser = toolParser;
    this.aiService = aiService;
  }
  /** 设置工具执行回调 */
  setOnToolExecution(callback) {
    this.onToolExecution = callback;
  }
  /** 执行完整的对话循环 */
  async run(context) {
    const { originalMessage, conversationHistory, maxIterations, fileContext } = context;
    const toolExecutions = [];
    let iterationCount = 0;
    let reachedMaxIterations = false;
    const messages = [...conversationHistory];
    let userContent = originalMessage;
    if (fileContext) {
      userContent = `Context from active note:

${fileContext}

User Question: ${originalMessage}`;
    }
    messages.push({ role: "user", content: userContent });
    let currentResponse = "";
    while (iterationCount < maxIterations) {
      iterationCount++;
      const aiResponse = await this.aiService.chatWithHistory(messages);
      const parsed = this.toolParser.parse(aiResponse);
      if (!parsed.hasToolCalls) {
        currentResponse = aiResponse;
        break;
      }
      if (parsed.textContent) {
        currentResponse = parsed.textContent;
      }
      const executionResults = await this.executeToolCalls(parsed.toolCalls);
      toolExecutions.push(...executionResults);
      messages.push({ role: "assistant", content: aiResponse });
      const toolResultsContent = this.formatToolResults(executionResults);
      messages.push({ role: "user", content: toolResultsContent });
      if (iterationCount >= maxIterations) {
        reachedMaxIterations = true;
        break;
      }
    }
    return {
      finalResponse: currentResponse,
      toolExecutions,
      iterationCount,
      reachedMaxIterations
    };
  }
  /** 执行单次迭代（用于测试） */
  async iterate(messages) {
    const aiResponse = await this.aiService.chatWithHistory(messages);
    const parsed = this.toolParser.parse(aiResponse);
    if (!parsed.hasToolCalls) {
      return {
        response: aiResponse,
        parsed,
        executions: [],
        shouldContinue: false
      };
    }
    const executions = await this.executeToolCalls(parsed.toolCalls);
    return {
      response: aiResponse,
      parsed,
      executions,
      shouldContinue: true
    };
  }
  /** 执行工具调用列表 */
  async executeToolCalls(toolCalls) {
    const executions = [];
    for (const toolCall of toolCalls) {
      const result = await this.executeSingleTool(toolCall);
      const execution = {
        toolCall,
        result,
        timestamp: /* @__PURE__ */ new Date()
      };
      executions.push(execution);
      if (this.onToolExecution) {
        this.onToolExecution(execution);
      }
    }
    return executions;
  }
  /** 执行单个工具调用 */
  async executeSingleTool(toolCall) {
    const availableTools = this.toolManager.getToolDefinitions().map((t) => t.name);
    if (!availableTools.includes(toolCall.tool)) {
      return {
        success: false,
        error: `Tool not found: ${toolCall.tool}. Available tools: ${availableTools.join(", ")}`
      };
    }
    return this.toolManager.execute(toolCall);
  }
  /** 格式化工具执行结果为消息内容 */
  formatToolResults(executions) {
    const results = executions.map((exec, index) => {
      const status = exec.result.success ? "\u2705 Success" : "\u274C Error";
      const content = exec.result.success ? exec.result.data : exec.result.error;
      return `Tool ${index + 1}: ${exec.toolCall.tool}
${status}
${content}`;
    });
    return `Tool execution results:

${results.join("\n\n")}`;
  }
};

// src/ui/context-indicator.ts
var ContextIndicator = class {
  constructor() {
    this.container = null;
    this.textEl = null;
    this.currentMode = "noFile";
  }
  render(container) {
    this.container = container.createDiv({ cls: "axon-context-indicator" });
    this.textEl = this.container.createSpan({ cls: "axon-context-text" });
    this.updateDisplay(this.currentMode);
    return this.container;
  }
  updateMode(mode, selectionLength) {
    this.currentMode = mode;
    this.updateDisplay(mode, selectionLength);
  }
  updateDisplay(mode, selectionLength) {
    if (!this.container || !this.textEl)
      return;
    this.container.removeClass("axon-context-selection");
    this.container.removeClass("axon-context-fullnote");
    this.container.removeClass("axon-context-nofile");
    switch (mode) {
      case "selection":
        this.textEl.textContent = selectionLength ? `\u{1F50D} Focused on Selection (${selectionLength} chars)` : "\u{1F50D} Focused on Selection";
        this.container.addClass("axon-context-selection");
        break;
      case "fullNote":
        this.textEl.textContent = "\u{1F4C4} Full Note Context";
        this.container.addClass("axon-context-fullnote");
        break;
      case "noFile":
        this.textEl.textContent = "\u26A0\uFE0F No file open";
        this.container.addClass("axon-context-nofile");
        break;
    }
  }
  getMode() {
    return this.currentMode;
  }
};

// src/ui/input-panel.ts
var AxonInputPanel = class {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.contextIndicator = new ContextIndicator();
  }
  render(container) {
    this.container = container;
    this.container.addClass("axon-input-panel");
    const agentModeIndicator = this.container.createDiv({
      cls: "axon-agent-mode-indicator"
    });
    agentModeIndicator.createSpan({ cls: "axon-agent-mode-icon", text: "\u{1F513}" });
    agentModeIndicator.createSpan({ cls: "axon-agent-mode-text", text: "Agent Mode Active" });
    const indicatorContainer = this.container.createDiv({
      cls: "axon-indicator-container"
    });
    this.contextIndicator.render(indicatorContainer);
    const inputWrapper = this.container.createDiv({
      cls: "axon-input-wrapper"
    });
    this.textarea = inputWrapper.createEl("textarea", {
      cls: "axon-textarea",
      attr: {
        placeholder: "\u8F93\u5165\u60A8\u7684\u6D88\u606F...",
        rows: "3"
      }
    });
    const buttonContainer = inputWrapper.createDiv({
      cls: "axon-button-container"
    });
    this.analyzeButton = buttonContainer.createEl("button", {
      cls: "axon-analyze-button",
      text: "\u{1F50D} \u5206\u6790"
    });
    this.sendButton = buttonContainer.createEl("button", {
      cls: "axon-send-button",
      text: "\u53D1\u9001"
    });
    this.bindEvents();
  }
  /** 更新上下文模式显示 */
  updateContextMode(mode, selectionLength) {
    this.contextIndicator.updateMode(mode, selectionLength);
  }
  bindEvents() {
    this.sendButton.addEventListener("click", () => {
      this.handleSend();
    });
    this.analyzeButton.addEventListener("click", () => {
      this.handleAnalyze();
    });
    this.textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleSend();
      }
    });
    this.textarea.addEventListener("input", () => {
      this.autoResize();
    });
  }
  handleSend() {
    const content = this.textarea.value.trim();
    if (!content)
      return;
    this.eventBus.emit("axon:send-message", { content });
    this.textarea.value = "";
    this.resetHeight();
    this.textarea.focus();
  }
  handleAnalyze() {
    this.eventBus.emit("axon:analyze-current-file", {});
  }
  autoResize() {
    this.textarea.style.height = "auto";
    this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + "px";
  }
  resetHeight() {
    this.textarea.style.height = "auto";
  }
  setEnabled(enabled) {
    this.textarea.disabled = !enabled;
    this.sendButton.disabled = !enabled;
    this.analyzeButton.disabled = !enabled;
  }
  setLoading(loading) {
    if (loading) {
      this.sendButton.textContent = "\u23F3 \u601D\u8003\u4E2D...";
      this.sendButton.addClass("axon-loading");
    } else {
      this.sendButton.textContent = "\u53D1\u9001";
      this.sendButton.removeClass("axon-loading");
    }
  }
};

// src/ui/insight-card.ts
var InsightCard = class {
  constructor(data) {
    this.container = null;
    this.headingsExpanded = true;
    this.data = data;
  }
  /** 渲染卡片到容器 */
  render(container) {
    this.container = container.createDiv({ cls: "axon-insight-card" });
    this.renderHeader();
    this.renderStats();
    this.renderLinks();
    this.renderFrontmatter();
    this.renderHeadings();
    return this.container;
  }
  /** 渲染头部信息 */
  renderHeader() {
    if (!this.container)
      return;
    const header = this.container.createDiv({ cls: "axon-insight-header" });
    const titleRow = header.createDiv({ cls: "axon-insight-title-row" });
    titleRow.createSpan({ cls: "axon-insight-icon", text: "\u{1F4C4}" });
    titleRow.createSpan({ cls: "axon-insight-filename", text: this.data.file.name });
    if (this.data.isEmpty) {
      titleRow.createSpan({ cls: "axon-insight-empty-badge", text: "\u7A7A\u6587\u6863" });
    }
    header.createDiv({
      cls: "axon-insight-path",
      text: this.data.file.path
    });
    header.createDiv({
      cls: "axon-insight-modified",
      text: `\u6700\u540E\u4FEE\u6539: ${this.data.stats.lastModified}`
    });
  }
  /** 渲染统计信息 */
  renderStats() {
    if (!this.container)
      return;
    const stats = this.container.createDiv({ cls: "axon-insight-stats" });
    this.createStatItem(stats, "\u{1F4DD}", "\u5B57\u6570", this.data.stats.wordCount.toString());
    this.createStatItem(stats, "\u{1F4CF}", "\u884C\u6570", this.data.stats.lineCount.toString());
    this.createStatItem(stats, "\u{1F4D1}", "\u6807\u9898", this.data.structure.headingCount.toString());
    this.createStatItem(
      stats,
      "\u{1F517}",
      "\u94FE\u63A5",
      (this.data.links.internalCount + this.data.links.externalCount).toString()
    );
  }
  /** 创建统计项 */
  createStatItem(container, icon, label, value) {
    const item = container.createDiv({ cls: "axon-stat-item" });
    item.createSpan({ cls: "axon-stat-icon", text: icon });
    item.createSpan({ cls: "axon-stat-label", text: label });
    item.createSpan({ cls: "axon-stat-value", text: value });
  }
  /** 渲染链接信息 */
  renderLinks() {
    if (!this.container)
      return;
    if (this.data.links.internalCount === 0 && this.data.links.externalCount === 0)
      return;
    const linksSection = this.container.createDiv({ cls: "axon-insight-links" });
    linksSection.createDiv({ cls: "axon-insight-section-title", text: "\u{1F517} \u94FE\u63A5\u8BE6\u60C5" });
    const linksContent = linksSection.createDiv({ cls: "axon-insight-links-content" });
    if (this.data.links.internalCount > 0) {
      const internalDiv = linksContent.createDiv({ cls: "axon-link-group" });
      internalDiv.createSpan({ cls: "axon-link-type", text: `\u5185\u90E8\u94FE\u63A5 (${this.data.links.internalCount})` });
    }
    if (this.data.links.externalCount > 0) {
      const externalDiv = linksContent.createDiv({ cls: "axon-link-group" });
      externalDiv.createSpan({ cls: "axon-link-type", text: `\u5916\u90E8\u94FE\u63A5 (${this.data.links.externalCount})` });
    }
  }
  /** 渲染 Frontmatter */
  renderFrontmatter() {
    if (!this.container || !this.data.frontmatter)
      return;
    const fm = this.data.frontmatter;
    const fmSection = this.container.createDiv({ cls: "axon-insight-frontmatter" });
    fmSection.createDiv({ cls: "axon-insight-section-title", text: "\u{1F4CB} \u5143\u6570\u636E" });
    const fmContent = fmSection.createDiv({ cls: "axon-insight-fm-content" });
    if (fm.title) {
      this.createFmItem(fmContent, "\u6807\u9898", fm.title);
    }
    if (fm.date) {
      this.createFmItem(fmContent, "\u65E5\u671F", fm.date);
    }
    if (fm.tags && fm.tags.length > 0) {
      const tagsDiv = fmContent.createDiv({ cls: "axon-fm-item" });
      tagsDiv.createSpan({ cls: "axon-fm-label", text: "\u6807\u7B7E: " });
      const tagsContainer = tagsDiv.createSpan({ cls: "axon-fm-tags" });
      fm.tags.forEach((tag) => {
        tagsContainer.createSpan({ cls: "axon-fm-tag", text: `#${tag}` });
      });
    }
  }
  /** 创建 Frontmatter 项 */
  createFmItem(container, label, value) {
    const item = container.createDiv({ cls: "axon-fm-item" });
    item.createSpan({ cls: "axon-fm-label", text: `${label}: ` });
    item.createSpan({ cls: "axon-fm-value", text: value });
  }
  /** 渲染标题结构 */
  renderHeadings() {
    if (!this.container || this.data.structure.headings.length === 0)
      return;
    const headingsSection = this.container.createDiv({ cls: "axon-insight-headings" });
    const titleRow = headingsSection.createDiv({ cls: "axon-insight-section-title axon-collapsible" });
    const toggleIcon = titleRow.createSpan({ cls: "axon-toggle-icon", text: this.headingsExpanded ? "\u25BC" : "\u25B6" });
    titleRow.createSpan({ text: " \u{1F4D1} \u6587\u6863\u7ED3\u6784" });
    const headingsContent = headingsSection.createDiv({
      cls: "axon-insight-headings-content" + (this.headingsExpanded ? "" : " axon-collapsed")
    });
    this.data.structure.headings.forEach((heading) => {
      const headingItem = headingsContent.createDiv({
        cls: `axon-heading-item axon-heading-level-${heading.level}`
      });
      headingItem.style.paddingLeft = `${(heading.level - 1) * 12}px`;
      headingItem.createSpan({ cls: "axon-heading-marker", text: "#".repeat(heading.level) + " " });
      headingItem.createSpan({ cls: "axon-heading-text", text: heading.text });
    });
    titleRow.addEventListener("click", () => {
      this.headingsExpanded = !this.headingsExpanded;
      toggleIcon.textContent = this.headingsExpanded ? "\u25BC" : "\u25B6";
      headingsContent.toggleClass("axon-collapsed", !this.headingsExpanded);
    });
  }
  /** 获取数据 */
  getData() {
    return this.data;
  }
};

// src/ui/actionable-card.ts
var ActionableCard = class {
  constructor(data, onAppend, onSaveNote, onReplace) {
    this.container = null;
    this.data = data;
    this.onAppend = onAppend;
    this.onSaveNote = onSaveNote;
    this.onReplace = onReplace;
  }
  render(container) {
    this.container = container.createDiv({ cls: "axon-actionable-card" });
    this.renderContent();
    this.renderActions();
    return this.container;
  }
  renderContent() {
    if (!this.container)
      return;
    const contentEl = this.container.createDiv({ cls: "axon-ai-response-content" });
    contentEl.innerHTML = this.renderMarkdown(this.data.aiResponse);
  }
  renderActions() {
    if (!this.container)
      return;
    const actionsEl = this.container.createDiv({ cls: "axon-action-buttons" });
    if (this.data.contextMode === "selection" && this.onReplace) {
      const replaceBtn = actionsEl.createEl("button", {
        cls: "axon-action-btn axon-action-replace",
        text: "\u{1F504} \u66FF\u6362\u9009\u533A"
      });
      replaceBtn.addEventListener("click", () => {
        this.onReplace?.();
      });
      const appendBtn = actionsEl.createEl("button", {
        cls: "axon-action-btn axon-action-append-secondary",
        text: "\u{1F4E5} \u8FFD\u52A0"
      });
      appendBtn.addEventListener("click", () => {
        this.onAppend();
      });
    } else {
      const appendBtn = actionsEl.createEl("button", {
        cls: "axon-action-btn axon-action-append",
        text: "\u{1F4E5} \u8FFD\u52A0\u5230\u7B14\u8BB0"
      });
      appendBtn.addEventListener("click", () => {
        this.onAppend();
      });
      const saveBtn = actionsEl.createEl("button", {
        cls: "axon-action-btn axon-action-save",
        text: "\u{1F4C4} \u4FDD\u5B58\u5BF9\u8BDD"
      });
      saveBtn.addEventListener("click", () => {
        this.onSaveNote();
      });
    }
  }
  /** 简单的 Markdown 渲染 */
  renderMarkdown(content) {
    let html = content;
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const langClass = lang ? ` language-${lang}` : "";
      return `<pre class="axon-code-block${langClass}"><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });
    html = html.replace(/`([^`]+)`/g, '<code class="axon-inline-code">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^# (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    if (!html.startsWith("<")) {
      html = `<p>${html}</p>`;
    }
    return html;
  }
  /** HTML 转义 */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  getData() {
    return this.data;
  }
};

// src/ui/tool-output-card.ts
var ToolOutputCard = class {
  constructor() {
    this.container = null;
    this.loadingEl = null;
    this.resultEl = null;
  }
  /** 渲染工具输出卡片 */
  render(container, data) {
    this.container = container.createDiv({ cls: "axon-tool-output" });
    const header = this.container.createDiv({ cls: "axon-tool-output-header" });
    const icon = header.createSpan({ cls: "axon-tool-output-icon" });
    icon.textContent = "\u26A1";
    const title = header.createSpan({ cls: "axon-tool-output-title" });
    title.textContent = `Tool: ${data.toolName}`;
    const time = header.createSpan({ cls: "axon-tool-output-time" });
    time.textContent = this.formatTime(data.timestamp);
    const paramsEl = this.container.createDiv({ cls: "axon-tool-output-params" });
    paramsEl.createEl("strong", { text: "Parameters:" });
    const paramsCode = paramsEl.createEl("pre");
    paramsCode.createEl("code", {
      text: JSON.stringify(data.params, null, 2)
    });
    this.resultEl = this.container.createDiv({ cls: "axon-tool-output-result" });
    this.renderResult(data.result);
    return this.container;
  }
  /** 渲染加载状态 */
  renderLoading(container, toolCall) {
    this.container = container.createDiv({ cls: "axon-tool-output axon-tool-output-loading" });
    const header = this.container.createDiv({ cls: "axon-tool-output-header" });
    const icon = header.createSpan({ cls: "axon-tool-output-icon" });
    icon.textContent = "\u26A1";
    const title = header.createSpan({ cls: "axon-tool-output-title" });
    title.textContent = `Tool: ${toolCall.tool}`;
    this.loadingEl = this.container.createDiv({ cls: "axon-tool-output-spinner" });
    this.loadingEl.createSpan({ cls: "axon-spinner" });
    this.loadingEl.createSpan({ text: " Executing..." });
    const paramsEl = this.container.createDiv({ cls: "axon-tool-output-params" });
    paramsEl.createEl("strong", { text: "Parameters:" });
    const paramsCode = paramsEl.createEl("pre");
    paramsCode.createEl("code", {
      text: JSON.stringify(toolCall.params, null, 2)
    });
    this.resultEl = this.container.createDiv({ cls: "axon-tool-output-result" });
    return this.container;
  }
  /** 更新为完成状态 */
  setComplete(result) {
    if (!this.container)
      return;
    this.container.removeClass("axon-tool-output-loading");
    if (this.loadingEl) {
      this.loadingEl.remove();
      this.loadingEl = null;
    }
    if (result.success) {
      this.container.addClass("axon-tool-output-success");
    } else {
      this.container.addClass("axon-tool-output-error");
    }
    if (this.resultEl) {
      this.resultEl.empty();
      this.renderResultContent(this.resultEl, result);
    }
  }
  /** 渲染结果内容 */
  renderResult(result) {
    if (!this.resultEl)
      return;
    if (this.container) {
      if (result.success) {
        this.container.addClass("axon-tool-output-success");
      } else {
        this.container.addClass("axon-tool-output-error");
      }
    }
    this.renderResultContent(this.resultEl, result);
  }
  /** 渲染结果内容到元素 */
  renderResultContent(el, result) {
    const statusEl = el.createDiv({ cls: "axon-tool-output-status" });
    if (result.success) {
      statusEl.createSpan({ text: "\u2705 Success", cls: "axon-tool-status-success" });
    } else {
      statusEl.createSpan({ text: "\u274C Error", cls: "axon-tool-status-error" });
    }
    const contentEl = el.createDiv({ cls: "axon-tool-output-content" });
    const content = result.success ? result.data : result.error;
    if (content) {
      if (content.length > 100 || content.includes("\n")) {
        const pre = contentEl.createEl("pre");
        pre.createEl("code", { text: content });
      } else {
        contentEl.textContent = content;
      }
    }
  }
  /** 格式化时间 */
  formatTime(date) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
};

// src/ui/console-output.ts
var AxonConsoleOutput = class {
  constructor(eventBus) {
    this.messages = [];
    this.eventBus = eventBus;
  }
  render(container) {
    this.container = container;
    this.container.addClass("axon-console-output");
    const header = this.container.createDiv({
      cls: "axon-console-header"
    });
    header.createEl("h4", {
      text: "\u63A7\u5236\u53F0\u8F93\u51FA",
      cls: "axon-console-title"
    });
    const clearButton = header.createEl("button", {
      cls: "axon-clear-button",
      text: "\u6E05\u9664"
    });
    clearButton.addEventListener("click", () => {
      this.eventBus.emit("axon:clear-console");
    });
    this.messagesContainer = this.container.createDiv({
      cls: "axon-messages-container"
    });
    this.addWelcomeMessage();
  }
  addWelcomeMessage() {
    this.addMessage({
      id: "welcome",
      type: "system",
      content: "\u6B22\u8FCE\u4F7F\u7528 Axon\uFF01\u60A8\u7684 AI Agent \u5DF2\u51C6\u5907\u5C31\u7EEA\u3002\u70B9\u51FB \u{1F50D} \u5206\u6790 \u6309\u94AE\u6765\u5206\u6790\u5F53\u524D\u7B14\u8BB0\u3002",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
  addMessage(message) {
    this.messages.push(message);
    const messageEl = this.createMessageElement(message);
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }
  /** 添加文件分析卡片 */
  addInsightCard(data) {
    const cardContainer = this.messagesContainer.createDiv({
      cls: "axon-message axon-message-analysis"
    });
    const header = cardContainer.createDiv({
      cls: "axon-message-header"
    });
    header.createEl("span", {
      cls: "axon-message-type",
      text: "\u{1F4CA} \u5206\u6790\u7ED3\u679C"
    });
    header.createEl("span", {
      cls: "axon-message-timestamp",
      text: this.formatTimestamp(data.analyzedAt)
    });
    const card = new InsightCard(data);
    card.render(cardContainer);
    this.scrollToBottom();
  }
  /** 添加可执行的 AI 响应卡片 */
  addActionableCard(data, onAppend, onSaveNote, onReplace) {
    const cardContainer = this.messagesContainer.createDiv({
      cls: "axon-message axon-message-assistant"
    });
    const header = cardContainer.createDiv({
      cls: "axon-message-header"
    });
    header.createEl("span", {
      cls: "axon-message-type",
      text: "\u{1F916} Axon"
    });
    header.createEl("span", {
      cls: "axon-message-timestamp",
      text: this.formatTimestamp(data.timestamp)
    });
    const card = new ActionableCard(data, onAppend, onSaveNote, onReplace);
    card.render(cardContainer);
    this.scrollToBottom();
  }
  clear() {
    this.messages = [];
    this.messagesContainer.empty();
    this.addWelcomeMessage();
  }
  createMessageElement(message) {
    const messageEl = this.messagesContainer.createDiv({
      cls: `axon-message axon-message-${message.type}`
    });
    const header = messageEl.createDiv({
      cls: "axon-message-header"
    });
    header.createEl("span", {
      cls: "axon-message-type",
      text: this.getTypeLabel(message.type)
    });
    header.createEl("span", {
      cls: "axon-message-timestamp",
      text: this.formatTimestamp(message.timestamp)
    });
    const content = messageEl.createDiv({
      cls: "axon-message-content"
    });
    content.innerHTML = this.parseSimpleFormatting(message.content);
    return messageEl;
  }
  getTypeLabel(type) {
    const labels = {
      user: "\u7528\u6237",
      assistant: "Axon",
      system: "\u7CFB\u7EDF",
      error: "\u9519\u8BEF",
      analysis: "\u5206\u6790"
    };
    return labels[type] || type;
  }
  formatTimestamp(date) {
    return date.toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  parseSimpleFormatting(content) {
    return content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/`(.*?)`/g, "<code>$1</code>").replace(/\n/g, "<br>");
  }
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
  /** 添加工具执行输出卡片 */
  addToolOutput(data) {
    const card = new ToolOutputCard();
    card.render(this.messagesContainer, data);
    this.scrollToBottom();
  }
  /** 添加工具执行加载状态卡片，返回卡片实例以便后续更新 */
  addToolOutputLoading(toolCall) {
    const card = new ToolOutputCard();
    card.renderLoading(this.messagesContainer, toolCall);
    this.scrollToBottom();
    return card;
  }
};

// src/core/axon-view.ts
var AXON_VIEW_TYPE = "axon-view";
var AxonView = class extends import_obsidian7.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.selectionUpdateInterval = null;
    this.plugin = plugin;
    this.eventBus = new SimpleEventBus();
    this.inputPanel = new AxonInputPanel(this.eventBus);
    this.consoleOutput = new AxonConsoleOutput(this.eventBus);
    this.fileAnalyzer = new FileAnalyzer(this.app);
    this.fileContext = new FileContext(this.app);
    this.deepSeekService = new DeepSeekService(this.app, () => this.plugin.settings);
    this.fileOperations = new FileOperations(this.app);
    this.selectionContext = new SelectionContext(this.app);
    this.toolManager = new ToolManager(this.app);
    this.toolParser = new ToolParser();
  }
  static get viewType() {
    return AXON_VIEW_TYPE;
  }
  getViewType() {
    return AXON_VIEW_TYPE;
  }
  getDisplayText() {
    return "Axon Console";
  }
  getIcon() {
    return "terminal-square";
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("axon-view-container");
    this.createLayout(container);
    this.bindEventListeners();
    this.setupFileContext();
    this.setupSelectionContext();
  }
  createLayout(container) {
    const mainContainer = container.createDiv({ cls: "axon-main-container" });
    const outputContainer = mainContainer.createDiv({ cls: "axon-output-container" });
    const inputContainer = mainContainer.createDiv({ cls: "axon-input-container" });
    this.consoleOutput.render(outputContainer);
    this.inputPanel.render(inputContainer);
  }
  bindEventListeners() {
    this.eventBus.on("axon:send-message", async (data) => {
      await this.handleSendMessage(data.content);
    });
    this.eventBus.on("axon:clear-console", () => {
      this.consoleOutput.clear();
    });
    this.eventBus.on("axon:analyze-current-file", async () => {
      await this.handleAnalyzeCurrentFile();
    });
  }
  setupSelectionContext() {
    this.selectionContext.updateState();
    this.updateContextIndicator();
    this.selectionUpdateInterval = window.setInterval(() => {
      this.selectionContext.updateState();
      this.updateContextIndicator();
    }, 200);
    this.selectionContext.onStateChange((state) => {
      this.updateContextIndicator();
    });
  }
  updateContextIndicator() {
    const state = this.selectionContext.state;
    const selectionLength = state.selectedText?.length;
    this.inputPanel.updateContextMode(state.mode, selectionLength);
  }
  async handleSendMessage(content) {
    if (content.startsWith("/")) {
      this.handleCommand(content);
      return;
    }
    this.consoleOutput.addMessage({
      type: "user",
      content,
      timestamp: /* @__PURE__ */ new Date()
    });
    if (!this.deepSeekService.isConfigured()) {
      this.consoleOutput.addMessage({
        type: "error",
        content: "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E DeepSeek API Key",
        timestamp: /* @__PURE__ */ new Date()
      });
      return;
    }
    this.selectionContext.updateState();
    const selectionState = this.selectionContext.state;
    const contextMode = selectionState.mode;
    const originalSelection = selectionState.originalSelection;
    this.setLoading(true);
    try {
      let fileContext;
      if (contextMode === "selection" && selectionState.selectedText) {
        fileContext = selectionState.selectedText;
      } else {
        fileContext = await this.getCurrentFileContent();
      }
      const response = await this.runAgentMode(content, fileContext);
      const conversationData = {
        userMessage: content,
        aiResponse: response,
        context: fileContext,
        timestamp: /* @__PURE__ */ new Date(),
        contextMode: contextMode === "selection" ? "selection" : "fullNote",
        originalSelection: originalSelection || void 0
      };
      if (contextMode === "selection" && originalSelection) {
        this.consoleOutput.addActionableCard(
          conversationData,
          () => this.handleAppendToNote(response),
          () => this.handleSaveNote(conversationData),
          () => this.handleReplaceSelection(response, originalSelection)
        );
      } else {
        this.consoleOutput.addActionableCard(
          conversationData,
          () => this.handleAppendToNote(response),
          () => this.handleSaveNote(conversationData)
        );
      }
    } catch (error) {
      console.error("AI chat error:", error);
      this.consoleOutput.addMessage({
        type: "error",
        content: error.message,
        timestamp: /* @__PURE__ */ new Date()
      });
    } finally {
      this.setLoading(false);
    }
  }
  /** 运行 Agent Mode 执行循环 */
  async runAgentMode(userMessage, fileContext) {
    const toolDefinitions = this.toolManager.getToolDefinitions();
    const systemPrompt = this.deepSeekService.buildAgentSystemPrompt(toolDefinitions);
    const executionLoop = new ExecutionLoop(
      this.toolManager,
      this.toolParser,
      {
        chatWithHistory: async (messages) => {
          return this.deepSeekService.chatWithHistory(messages);
        }
      }
    );
    executionLoop.setOnToolExecution((execution) => {
      this.consoleOutput.addToolOutput({
        toolName: execution.toolCall.tool,
        params: execution.toolCall.params,
        result: execution.result,
        timestamp: execution.timestamp
      });
    });
    const result = await executionLoop.run({
      originalMessage: userMessage,
      conversationHistory: [{ role: "system", content: systemPrompt }],
      maxIterations: 10,
      fileContext
    });
    if (result.reachedMaxIterations) {
      this.consoleOutput.addMessage({
        type: "system",
        content: "\u26A0\uFE0F \u8FBE\u5230\u6700\u5927\u8FED\u4EE3\u6B21\u6570\u9650\u5236\uFF0C\u5BF9\u8BDD\u5DF2\u505C\u6B62",
        timestamp: /* @__PURE__ */ new Date()
      });
    }
    return result.finalResponse;
  }
  handleCommand(content) {
    const cmd = content.toLowerCase().trim();
    if (cmd === "/help") {
      this.consoleOutput.addMessage({
        type: "assistant",
        content: "**\u53EF\u7528\u547D\u4EE4:**\n\u2022 `/help` - \u663E\u793A\u5E2E\u52A9\n\u2022 `/analyze` - \u5206\u6790\u5F53\u524D\u6587\u4EF6\n\u2022 `/clear` - \u6E05\u9664\u63A7\u5236\u53F0\n\u2022 `/settings` - \u6253\u5F00\u8BBE\u7F6E",
        timestamp: /* @__PURE__ */ new Date()
      });
    } else if (cmd === "/analyze") {
      this.eventBus.emit("axon:analyze-current-file", {});
    } else if (cmd === "/clear") {
      this.consoleOutput.clear();
    } else if (cmd === "/settings") {
      this.app.setting.open();
      this.app.setting.openTabById("axon");
    } else {
      this.consoleOutput.addMessage({
        type: "system",
        content: `\u672A\u77E5\u547D\u4EE4: ${content}`,
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
  async getCurrentFileContent() {
    const file = this.fileOperations.getActiveFile();
    if (!file || file.extension !== "md") {
      return void 0;
    }
    try {
      return await this.app.vault.read(file);
    } catch {
      return void 0;
    }
  }
  async handleAppendToNote(content) {
    try {
      await this.fileOperations.appendToCurrentFile(content);
    } catch (error) {
      this.consoleOutput.addMessage({
        type: "error",
        content: error.message,
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
  async handleSaveNote(conversation) {
    try {
      await this.fileOperations.createChatNote(conversation);
    } catch (error) {
      this.consoleOutput.addMessage({
        type: "error",
        content: error.message,
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
  async handleReplaceSelection(content, originalSelection) {
    try {
      await this.fileOperations.replaceSelection(content, originalSelection);
    } catch (error) {
      this.consoleOutput.addMessage({
        type: "error",
        content: error.message,
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
  setLoading(loading) {
    this.isLoading = loading;
    this.inputPanel.setEnabled(!loading);
    this.inputPanel.setLoading(loading);
  }
  setupFileContext() {
    this.fileContext.onFileChange((data) => {
      if (data.file) {
        this.consoleOutput.addMessage({
          type: "system",
          content: `\u{1F4C2} \u5DF2\u5207\u6362\u5230: ${data.file.name}`,
          timestamp: /* @__PURE__ */ new Date()
        });
      }
      this.selectionContext.updateState();
      this.updateContextIndicator();
    });
    this.fileContext.startWatching();
  }
  async handleAnalyzeCurrentFile() {
    try {
      let file = null;
      const activeView = this.app.workspace.getActiveViewOfType(import_obsidian7.MarkdownView);
      if (activeView && activeView.file) {
        file = activeView.file;
      }
      if (!file) {
        file = this.app.workspace.getActiveFile();
      }
      if (!file) {
        this.consoleOutput.addMessage({
          type: "error",
          content: "\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u6587\u4EF6",
          timestamp: /* @__PURE__ */ new Date()
        });
        return;
      }
      if (!this.fileAnalyzer.isMarkdownFile(file)) {
        this.consoleOutput.addMessage({
          type: "error",
          content: "\u4EC5\u652F\u6301 Markdown \u6587\u4EF6\u5206\u6790",
          timestamp: /* @__PURE__ */ new Date()
        });
        return;
      }
      const result = await this.fileAnalyzer.analyzeFile(file);
      if (result.isEmpty) {
        this.consoleOutput.addMessage({
          type: "system",
          content: `\u{1F4C4} ${file.name} \u662F\u4E00\u4E2A\u7A7A\u6587\u6863`,
          timestamp: /* @__PURE__ */ new Date()
        });
      }
      this.consoleOutput.addInsightCard(result);
    } catch (error) {
      console.error("Analysis error:", error);
      this.consoleOutput.addMessage({
        type: "error",
        content: "\u5206\u6790\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF\uFF0C\u8BF7\u91CD\u8BD5",
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
  async onClose() {
    if (this.selectionUpdateInterval !== null) {
      window.clearInterval(this.selectionUpdateInterval);
      this.selectionUpdateInterval = null;
    }
    this.selectionContext.clearCallbacks();
    this.fileContext.stopWatching();
    this.fileContext.clearCallbacks();
    this.eventBus.clear();
  }
  clearConsole() {
    this.consoleOutput.clear();
  }
};

// src/core/settings-tab.ts
var import_obsidian8 = require("obsidian");
var AxonSettingsTab = class extends import_obsidian8.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Axon \u8BBE\u7F6E" });
    new import_obsidian8.Setting(containerEl).setName("DeepSeek API Key").setDesc("\u8F93\u5165\u4F60\u7684 DeepSeek API \u5BC6\u94A5").addText((text) => {
      text.setPlaceholder("sk-...").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      });
      text.inputEl.type = "password";
      text.inputEl.addClass("axon-api-key-input");
    });
    new import_obsidian8.Setting(containerEl).setName("\u663E\u793A API Key").setDesc("\u5207\u6362 API Key \u7684\u53EF\u89C1\u6027").addToggle((toggle) => {
      toggle.setValue(false).onChange((value) => {
        const input = containerEl.querySelector(".axon-api-key-input");
        if (input) {
          input.type = value ? "text" : "password";
        }
      });
    });
    new import_obsidian8.Setting(containerEl).setName("\u6A21\u578B\u540D\u79F0").setDesc("DeepSeek \u6A21\u578B\u540D\u79F0\uFF08\u9ED8\u8BA4: deepseek-chat\uFF09").addText((text) => text.setPlaceholder("deepseek-chat").setValue(this.plugin.settings.modelName).onChange(async (value) => {
      this.plugin.settings.modelName = value || "deepseek-chat";
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u72B6\u6001" });
    const statusEl = containerEl.createDiv({ cls: "axon-settings-status" });
    if (this.plugin.settings.apiKey) {
      statusEl.createEl("p", {
        text: "\u2705 API Key \u5DF2\u914D\u7F6E",
        cls: "axon-status-ok"
      });
      statusEl.createEl("p", {
        text: `\u6A21\u578B: ${this.plugin.settings.modelName}`,
        cls: "axon-status-info"
      });
    } else {
      statusEl.createEl("p", {
        text: "\u26A0\uFE0F \u8BF7\u914D\u7F6E API Key \u4EE5\u542F\u7528 AI \u529F\u80FD",
        cls: "axon-status-warning"
      });
    }
    containerEl.createEl("h3", { text: "\u4F7F\u7528\u8BF4\u660E" });
    const helpEl = containerEl.createDiv({ cls: "axon-settings-help" });
    helpEl.createEl("p", { text: "1. \u5728 DeepSeek \u5B98\u7F51\u83B7\u53D6 API Key" });
    helpEl.createEl("p", { text: "2. \u5C06 API Key \u7C98\u8D34\u5230\u4E0A\u65B9\u8F93\u5165\u6846" });
    helpEl.createEl("p", { text: "3. \u6253\u5F00 Axon \u4FA7\u8FB9\u680F\u5F00\u59CB\u5BF9\u8BDD" });
    const linkEl = helpEl.createEl("a", {
      text: "\u83B7\u53D6 DeepSeek API Key \u2192",
      href: "https://platform.deepseek.com/"
    });
    linkEl.setAttr("target", "_blank");
  }
};

// src/core/types.ts
var DEFAULT_SETTINGS = {
  apiKey: "",
  modelName: "deepseek-chat"
};

// src/main.ts
var AxonPlugin = class extends import_obsidian9.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    console.log("Loading Axon plugin...");
    await this.loadSettings();
    this.registerView(
      AXON_VIEW_TYPE,
      (leaf) => new AxonView(leaf, this)
    );
    this.addSettingTab(new AxonSettingsTab(this.app, this));
    this.addRibbonIcon("terminal-square", "Axon Console", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-axon-console",
      name: "\u6253\u5F00 Axon \u63A7\u5236\u53F0",
      callback: () => {
        this.activateView();
      }
    });
    this.addCommand({
      id: "analyze-current-file",
      name: "\u5206\u6790\u5F53\u524D\u6587\u4EF6",
      callback: async () => {
        await this.activateView();
      }
    });
    console.log("Axon plugin loaded successfully");
  }
  onunload() {
    console.log("Unloading Axon plugin...");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = null;
    const leaves = workspace.getLeavesOfType(AXON_VIEW_TYPE);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: AXON_VIEW_TYPE,
          active: true
        });
      }
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
};
