(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // src/core/axon-view.ts
  var import_obsidian = __require("obsidian");

  // src/ui/input-panel.ts
  var AxonInputPanel = class {
    container;
    textarea;
    sendButton;
    eventBus;
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
      if (!content) return;
      this.eventBus.emit("axon:send-message", { content });
      this.textarea.value = "";
      this.resetHeight();
      this.textarea.focus();
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
    }
  };

  // src/ui/console-output.ts
  var AxonConsoleOutput = class {
    container;
    messagesContainer;
    eventBus;
    messages = [];
    constructor(eventBus) {
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
        content: "\u6B22\u8FCE\u4F7F\u7528 Axon\uFF01\u60A8\u7684 AI Agent \u5DF2\u51C6\u5907\u5C31\u7EEA\u3002",
        timestamp: /* @__PURE__ */ new Date()
      });
    }
    addMessage(message) {
      this.messages.push(message);
      const messageEl = this.createMessageElement(message);
      this.messagesContainer.appendChild(messageEl);
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
      const typeLabel = header.createEl("span", {
        cls: "axon-message-type",
        text: this.getTypeLabel(message.type)
      });
      const timestamp = header.createEl("span", {
        cls: "axon-message-timestamp",
        text: this.formatTimestamp(message.timestamp)
      });
      const content = messageEl.createDiv({
        cls: "axon-message-content"
      });
      content.setInnerHTML(this.parseSimpleFormatting(message.content));
      return messageEl;
    }
    getTypeLabel(type) {
      const labels = {
        user: "\u7528\u6237",
        assistant: "Axon",
        system: "\u7CFB\u7EDF",
        error: "\u9519\u8BEF"
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

  // src/core/event-bus.ts
  var SimpleEventBus = class {
    events = /* @__PURE__ */ new Map();
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

  // src/core/axon-view.ts
  var AXON_VIEW_TYPE = "axon-view";
  var AxonView = class extends import_obsidian.ItemView {
    inputPanel;
    consoleOutput;
    eventBus;
    constructor(leaf) {
      super(leaf);
      this.eventBus = new SimpleEventBus();
      this.inputPanel = new AxonInputPanel(this.eventBus);
      this.consoleOutput = new AxonConsoleOutput(this.eventBus);
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
            content: `Error: ${error.message}`,
            timestamp: /* @__PURE__ */ new Date()
          });
        }
      });
      this.eventBus.on("axon:clear-console", () => {
        this.consoleOutput.clear();
      });
    }
    processMessage(content) {
      return `Axon is listening: ${content}`;
    }
    async onClose() {
      this.eventBus.clear();
    }
    // 公开方法供外部调用
    clearConsole() {
      this.consoleOutput.clear();
    }
  };
})();
