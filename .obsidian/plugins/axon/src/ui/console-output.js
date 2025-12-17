(() => {
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
})();
