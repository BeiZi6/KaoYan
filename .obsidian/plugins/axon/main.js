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
var import_obsidian4 = require("obsidian");

// src/core/axon-view.ts
var import_obsidian3 = require("obsidian");

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

// src/ui/input-panel.ts
var AxonInputPanel = class {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  render(container) {
    this.container = container;
    this.container.addClass("axon-input-panel");
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
};

// src/core/axon-view.ts
var AXON_VIEW_TYPE = "axon-view";
var AxonView = class extends import_obsidian3.ItemView {
  constructor(leaf) {
    super(leaf);
    this.eventBus = new SimpleEventBus();
    this.inputPanel = new AxonInputPanel(this.eventBus);
    this.consoleOutput = new AxonConsoleOutput(this.eventBus);
    this.fileAnalyzer = new FileAnalyzer(this.app);
    this.fileContext = new FileContext(this.app);
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
  }
  createLayout(container) {
    const mainContainer = container.createDiv({
      cls: "axon-main-container"
    });
    const outputContainer = mainContainer.createDiv({
      cls: "axon-output-container"
    });
    const inputContainer = mainContainer.createDiv({
      cls: "axon-input-container"
    });
    this.consoleOutput.render(outputContainer);
    this.inputPanel.render(inputContainer);
  }
  bindEventListeners() {
    this.eventBus.on("axon:send-message", async (data) => {
      try {
        this.consoleOutput.addMessage({
          type: "user",
          content: data.content,
          timestamp: /* @__PURE__ */ new Date()
        });
        const response = this.processMessage(data.content);
        this.consoleOutput.addMessage({
          type: "assistant",
          content: response,
          timestamp: /* @__PURE__ */ new Date()
        });
      } catch (error) {
        this.consoleOutput.addMessage({
          type: "error",
          content: `\u9519\u8BEF: ${error.message}`,
          timestamp: /* @__PURE__ */ new Date()
        });
      }
    });
    this.eventBus.on("axon:clear-console", () => {
      this.consoleOutput.clear();
    });
    this.eventBus.on("axon:analyze-current-file", async () => {
      await this.handleAnalyzeCurrentFile();
    });
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
    });
    this.fileContext.startWatching();
  }
  async handleAnalyzeCurrentFile() {
    try {
      let file = null;
      const activeView = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
      if (activeView && activeView.file) {
        file = activeView.file;
      }
      if (!file) {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view) {
          const view = activeLeaf.view;
          if (view.file) {
            file = view.file;
          }
        }
      }
      if (!file) {
        file = this.app.workspace.getActiveFile();
      }
      if (!file) {
        this.consoleOutput.addMessage({
          type: "error",
          content: "\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u6587\u4EF6\uFF08\u5728 Obsidian \u7F16\u8F91\u5668\u4E2D\uFF09",
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
  processMessage(content) {
    if (content.toLowerCase() === "/help") {
      return "**\u53EF\u7528\u547D\u4EE4:**\n\u2022 `/help` - \u663E\u793A\u5E2E\u52A9\n\u2022 `/analyze` - \u5206\u6790\u5F53\u524D\u6587\u4EF6\n\u2022 `/clear` - \u6E05\u9664\u63A7\u5236\u53F0";
    }
    if (content.toLowerCase() === "/analyze") {
      this.eventBus.emit("axon:analyze-current-file", {});
      return "\u6B63\u5728\u5206\u6790\u5F53\u524D\u6587\u4EF6...";
    }
    if (content.toLowerCase() === "/clear") {
      this.eventBus.emit("axon:clear-console");
      return "";
    }
    return `Axon \u6536\u5230: ${content}`;
  }
  async onClose() {
    this.fileContext.stopWatching();
    this.fileContext.clearCallbacks();
    this.eventBus.clear();
  }
  clearConsole() {
    this.consoleOutput.clear();
  }
};

// src/main.ts
var AxonPlugin = class extends import_obsidian4.Plugin {
  async onload() {
    console.log("Loading Axon plugin...");
    this.registerView(
      AXON_VIEW_TYPE,
      (leaf) => new AxonView(leaf)
    );
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
        const leaves = this.app.workspace.getLeavesOfType(AXON_VIEW_TYPE);
        if (leaves.length > 0) {
          const view = leaves[0].view;
        }
      }
    });
    console.log("Axon plugin loaded successfully");
  }
  onunload() {
    console.log("Unloading Axon plugin...");
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
