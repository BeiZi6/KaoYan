/**
 * Axon - Main View Component
 * Obsidian 侧边栏视图
 */

import { ItemView, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { SimpleEventBus } from './event-bus';
import { FileAnalyzer } from './file-analyzer';
import { FileContext } from './file-context';
import { AxonInputPanel } from '../ui/input-panel';
import { AxonConsoleOutput } from '../ui/console-output';

export const AXON_VIEW_TYPE = 'axon-view';

export class AxonView extends ItemView {
  private inputPanel: AxonInputPanel;
  private consoleOutput: AxonConsoleOutput;
  private eventBus: SimpleEventBus;
  private fileAnalyzer: FileAnalyzer;
  private fileContext: FileContext;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.eventBus = new SimpleEventBus();
    this.inputPanel = new AxonInputPanel(this.eventBus);
    this.consoleOutput = new AxonConsoleOutput(this.eventBus);
    this.fileAnalyzer = new FileAnalyzer(this.app);
    this.fileContext = new FileContext(this.app);
  }

  static get viewType(): string {
    return AXON_VIEW_TYPE;
  }

  getViewType(): string {
    return AXON_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Axon Console';
  }

  getIcon(): string {
    return 'terminal-square';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('axon-view-container');

    this.createLayout(container);
    this.bindEventListeners();
    this.setupFileContext();
  }

  private createLayout(container: HTMLElement): void {
    const mainContainer = container.createDiv({
      cls: 'axon-main-container'
    });

    const outputContainer = mainContainer.createDiv({
      cls: 'axon-output-container'
    });

    const inputContainer = mainContainer.createDiv({
      cls: 'axon-input-container'
    });

    this.consoleOutput.render(outputContainer);
    this.inputPanel.render(inputContainer);
  }


  private bindEventListeners(): void {
    // 处理发送消息
    this.eventBus.on('axon:send-message', async (data: { content: string }) => {
      try {
        this.consoleOutput.addMessage({
          type: 'user',
          content: data.content,
          timestamp: new Date()
        });

        const response = this.processMessage(data.content);
        this.consoleOutput.addMessage({
          type: 'assistant',
          content: response,
          timestamp: new Date()
        });
      } catch (error) {
        this.consoleOutput.addMessage({
          type: 'error',
          content: `错误: ${(error as Error).message}`,
          timestamp: new Date()
        });
      }
    });

    // 处理清除控制台
    this.eventBus.on('axon:clear-console', () => {
      this.consoleOutput.clear();
    });

    // 处理分析当前文件
    this.eventBus.on('axon:analyze-current-file', async () => {
      await this.handleAnalyzeCurrentFile();
    });
  }

  private setupFileContext(): void {
    // 监听文件变化
    this.fileContext.onFileChange((data) => {
      if (data.file) {
        this.consoleOutput.addMessage({
          type: 'system',
          content: `📂 已切换到: ${data.file.name}`,
          timestamp: new Date()
        });
      }
    });

    // 开始监听
    this.fileContext.startWatching();
  }

  private async handleAnalyzeCurrentFile(): Promise<void> {
    try {
      // 尝试多种方式获取当前活动文件
      let file = null;
      
      // 方式1: 从 MarkdownView 获取
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView && activeView.file) {
        file = activeView.file;
      }
      
      // 方式2: 从活动叶子获取
      if (!file) {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view) {
          const view = activeLeaf.view as any;
          if (view.file) {
            file = view.file;
          }
        }
      }
      
      // 方式3: 从 workspace 获取活动文件
      if (!file) {
        file = this.app.workspace.getActiveFile();
      }
      
      if (!file) {
        this.consoleOutput.addMessage({
          type: 'error',
          content: '请先打开一个 Markdown 文件（在 Obsidian 编辑器中）',
          timestamp: new Date()
        });
        return;
      }

      // 检查是否为 Markdown 文件
      if (!this.fileAnalyzer.isMarkdownFile(file)) {
        this.consoleOutput.addMessage({
          type: 'error',
          content: '仅支持 Markdown 文件分析',
          timestamp: new Date()
        });
        return;
      }

      // 执行分析
      const result = await this.fileAnalyzer.analyzeFile(file);

      // 显示分析结果
      if (result.isEmpty) {
        this.consoleOutput.addMessage({
          type: 'system',
          content: `📄 ${file.name} 是一个空文档`,
          timestamp: new Date()
        });
      }

      this.consoleOutput.addInsightCard(result);

    } catch (error) {
      console.error('Analysis error:', error);
      this.consoleOutput.addMessage({
        type: 'error',
        content: '分析过程中发生错误，请重试',
        timestamp: new Date()
      });
    }
  }

  private processMessage(content: string): string {
    // 简单的命令处理
    if (content.toLowerCase() === '/help') {
      return '**可用命令:**\n• `/help` - 显示帮助\n• `/analyze` - 分析当前文件\n• `/clear` - 清除控制台';
    }
    
    if (content.toLowerCase() === '/analyze') {
      this.eventBus.emit('axon:analyze-current-file', {});
      return '正在分析当前文件...';
    }
    
    if (content.toLowerCase() === '/clear') {
      this.eventBus.emit('axon:clear-console');
      return '';
    }

    return `Axon 收到: ${content}`;
  }

  async onClose(): Promise<void> {
    this.fileContext.stopWatching();
    this.fileContext.clearCallbacks();
    this.eventBus.clear();
  }

  clearConsole(): void {
    this.consoleOutput.clear();
  }
}
