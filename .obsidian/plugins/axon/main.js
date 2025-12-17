const { Plugin, ItemView, WorkspaceLeaf, Notice } = require('obsidian');

class AxonView extends ItemView {
  constructor(leaf) {
    super(leaf);
  }

  static get viewType() {
    return 'axon-view';
  }

  getViewType() {
    return 'axon-view';
  }

  getDisplayText() {
    return 'Axon Console';
  }

  getIcon() {
    return 'terminal-square';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('axon-view-container');

    const mainContainer = container.createDiv({ cls: 'axon-main-container' });

    // Create console output section
    const consoleOutput = mainContainer.createDiv({ cls: 'axon-console-output' });

    // Header
    const header = consoleOutput.createDiv({ cls: 'axon-console-header' });
    header.createEl('h4', { text: '控制台输出', cls: 'axon-console-title' });
    const clearButton = header.createEl('button', { text: '清除', cls: 'axon-clear-button' });

    // Messages container
    const messagesContainer = consoleOutput.createDiv({ cls: 'axon-messages-container' });

    // Create input panel
    const inputPanel = mainContainer.createDiv({ cls: 'axon-input-panel' });
    const inputWrapper = inputPanel.createDiv({ cls: 'axon-input-wrapper' });
    
    const textarea = inputWrapper.createEl('textarea', {
      cls: 'axon-textarea',
      attr: { placeholder: '输入您的消息...', rows: '3' }
    });

    const buttonContainer = inputWrapper.createDiv({ cls: 'axon-button-container' });
    const sendButton = buttonContainer.createEl('button', { 
      text: '发送消息', 
      cls: 'axon-send-button' 
    });

    // Store reference for later use
    this.messagesContainer = messagesContainer;

    // Events
    sendButton.addEventListener('click', () => this.handleSend(textarea, messagesContainer));
    
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleSend(textarea, messagesContainer);
      }
    });

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });

    clearButton.addEventListener('click', () => {
      messagesContainer.empty();
      this.addWelcomeMessage(messagesContainer);
    });

    // Welcome message
    this.addWelcomeMessage(messagesContainer);
  }

  addWelcomeMessage(container) {
    const welcome = container.createDiv({ cls: 'axon-message axon-message-system' });
    const header = welcome.createDiv({ cls: 'axon-message-header' });
    header.createEl('span', { text: '系统', cls: 'axon-message-type' });
    header.createEl('span', { 
      text: new Date().toLocaleTimeString('zh-CN', { hour12: false }), 
      cls: 'axon-message-timestamp' 
    });
    welcome.createDiv({ 
      cls: 'axon-message-content', 
      text: '欢迎使用 Axon！您的 AI Agent 已准备就绪。' 
    });
  }

  handleSend(textarea, container) {
    const content = textarea.value.trim();
    if (!content) return;

    // Add user message
    const userMsg = container.createDiv({ cls: 'axon-message axon-message-user' });
    const userHeader = userMsg.createDiv({ cls: 'axon-message-header' });
    userHeader.createEl('span', { text: '用户', cls: 'axon-message-type' });
    userHeader.createEl('span', { 
      text: new Date().toLocaleTimeString('zh-CN', { hour12: false }), 
      cls: 'axon-message-timestamp' 
    });
    userMsg.createDiv({ cls: 'axon-message-content', text: content });

    // Add Axon response
    const response = `Axon is listening: ${content}`;
    const axMsg = container.createDiv({ cls: 'axon-message axon-message-assistant' });
    const axHeader = axMsg.createDiv({ cls: 'axon-message-header' });
    axHeader.createEl('span', { text: 'Axon', cls: 'axon-message-type' });
    axHeader.createEl('span', { 
      text: new Date().toLocaleTimeString('zh-CN', { hour12: false }), 
      cls: 'axon-message-timestamp' 
    });
    axMsg.createDiv({ cls: 'axon-message-content', text: response });

    // Clear input and scroll
    textarea.value = '';
    textarea.style.height = 'auto';
    textarea.focus();
    container.scrollTop = container.scrollHeight;
  }

  async onClose() {
    // Nothing to clean up.
  }
}

class AxonPlugin extends Plugin {
  async onload() {
    console.log('Loading Axon plugin...');

    // Register view
    this.registerView(
      AxonView.viewType,
      (leaf) => new AxonView(leaf)
    );

    // Add ribbon icon
    this.addRibbonIcon('terminal-square', 'Axon Console', () => {
      this.activateView();
    });

    // Add command
    this.addCommand({
      id: 'open-axon-console',
      name: '打开 Axon 控制台',
      callback: () => {
        this.activateView();
      }
    });

    new Notice('Axon plugin loaded successfully! 🎉');
    console.log('Axon plugin loaded successfully');
  }

  onunload() {
    console.log('Unloading Axon plugin...');
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(AxonView.viewType)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: AxonView.viewType,
          active: true,
        });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}

module.exports = AxonPlugin;
