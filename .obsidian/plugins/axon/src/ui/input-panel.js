(() => {
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
})();
