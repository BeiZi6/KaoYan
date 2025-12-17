/**
 * Axon - Main View Component
 * Obsidian 侧边栏视图
 */

import { ItemView, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { SimpleEventBus } from './event-bus';
import { FileAnalyzer } from './file-analyzer';
import { FileContext } from './file-context';
import { DeepSeekService } from './deepseek-service';
import { FileOperations } from './file-operations';
import { SelectionContext } from './selection-context';
import { ToolManager } from './tool-manager';
import { ToolParser } from './tool-parser';
import { ExecutionLoop, ToolExecution } from './execution-loop';
import { ConversationData, ChatMessage } from './types';
import { AxonInputPanel } from '../ui/input-panel';
import { AxonConsoleOutput } from '../ui/console-output';
import type AxonPlugin from '../main';

export const AXON_VIEW_TYPE = 'axon-view';

export class AxonView extends ItemView {
  private plugin: AxonPlugin;
  private inputPanel: AxonInputPanel;
  private consoleOutput: AxonConsoleOutput;
  private eventBus: SimpleEventBus;
  private fileAnalyzer: FileAnalyzer;
  private fileContext: FileContext;
  private deepSeekService: DeepSeekService;
  private fileOperations: FileOperations;
  private selectionContext: SelectionContext;
  private toolManager: ToolManager;
  private toolParser: ToolParser;
  private selectionUpdateInterval: number | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: AxonPlugin) {
    super(leaf);
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
    this.setupSelectionContext();
  }

  private createLayout(container: HTMLElement): void {
    const mainContainer = container.createDiv({ cls: 'axon-main-container' });
    const outputContainer = mainContainer.createDiv({ cls: 'axon-output-container' });
    const inputContainer = mainContainer.createDiv({ cls: 'axon-input-container' });

    this.consoleOutput.render(outputContainer);
    this.inputPanel.render(inputContainer);
  }

  private bindEventListeners(): void {
    this.eventBus.on('axon:send-message', async (data: { content: string }) => {
      await this.handleSendMessage(data.content);
    });

    this.eventBus.on('axon:clear-console', () => {
      this.consoleOutput.clear();
    });

    this.eventBus.on('axon:analyze-current-file', async () => {
      await this.handleAnalyzeCurrentFile();
    });
  }

  private setupSelectionContext(): void {
    // 初始更新
    this.selectionContext.updateState();
    this.updateContextIndicator();

    // 定期检查选区变化 (每 200ms)
    this.selectionUpdateInterval = window.setInterval(() => {
      this.selectionContext.updateState();
      this.updateContextIndicator();
    }, 200);

    // 监听选区状态变化
    this.selectionContext.onStateChange((state) => {
      this.updateContextIndicator();
    });
  }

  private updateContextIndicator(): void {
    const state = this.selectionContext.state;
    const selectionLength = state.selectedText?.length;
    this.inputPanel.updateContextMode(state.mode, selectionLength);
  }

  private async handleSendMessage(content: string): Promise<void> {
    if (content.startsWith('/')) {
      this.handleCommand(content);
      return;
    }

    this.consoleOutput.addMessage({
      type: 'user',
      content: content,
      timestamp: new Date()
    });

    if (!this.deepSeekService.isConfigured()) {
      this.consoleOutput.addMessage({
        type: 'error',
        content: '请先在设置中配置 DeepSeek API Key',
        timestamp: new Date()
      });
      return;
    }

    // 获取当前选区状态
    this.selectionContext.updateState();
    const selectionState = this.selectionContext.state;
    const contextMode = selectionState.mode;
    const originalSelection = selectionState.originalSelection;

    this.setLoading(true);

    try {
      // 获取文件上下文
      let fileContext: string | undefined;
      if (contextMode === 'selection' && selectionState.selectedText) {
        fileContext = selectionState.selectedText;
      } else {
        fileContext = await this.getCurrentFileContent();
      }

      // 使用 Agent Mode 执行循环
      const response = await this.runAgentMode(content, fileContext);

      const conversationData: ConversationData = {
        userMessage: content,
        aiResponse: response,
        context: fileContext,
        timestamp: new Date(),
        contextMode: contextMode === 'selection' ? 'selection' : 'fullNote',
        originalSelection: originalSelection || undefined
      };

      // 根据模式显示不同的操作按钮
      if (contextMode === 'selection' && originalSelection) {
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
      console.error('AI chat error:', error);
      this.consoleOutput.addMessage({
        type: 'error',
        content: (error as Error).message,
        timestamp: new Date()
      });
    } finally {
      this.setLoading(false);
    }
  }

  /** 运行 Agent Mode 执行循环 */
  private async runAgentMode(userMessage: string, fileContext?: string): Promise<string> {
    // 构建 Agent System Prompt
    const toolDefinitions = this.toolManager.getToolDefinitions();
    const systemPrompt = this.deepSeekService.buildAgentSystemPrompt(toolDefinitions);

    // 创建执行循环
    const executionLoop = new ExecutionLoop(
      this.toolManager,
      this.toolParser,
      {
        chatWithHistory: async (messages: ChatMessage[]) => {
          return this.deepSeekService.chatWithHistory(messages);
        }
      }
    );

    // 设置工具执行回调 - 显示工具输出卡片
    executionLoop.setOnToolExecution((execution: ToolExecution) => {
      this.consoleOutput.addToolOutput({
        toolName: execution.toolCall.tool,
        params: execution.toolCall.params,
        result: execution.result,
        timestamp: execution.timestamp
      });
    });

    // 运行执行循环
    const result = await executionLoop.run({
      originalMessage: userMessage,
      conversationHistory: [{ role: 'system', content: systemPrompt }],
      maxIterations: 10,
      fileContext
    });

    // 如果达到最大迭代次数，显示警告
    if (result.reachedMaxIterations) {
      this.consoleOutput.addMessage({
        type: 'system',
        content: '⚠️ 达到最大迭代次数限制，对话已停止',
        timestamp: new Date()
      });
    }

    return result.finalResponse;
  }

  private handleCommand(content: string): void {
    const cmd = content.toLowerCase().trim();
    
    if (cmd === '/help') {
      this.consoleOutput.addMessage({
        type: 'assistant',
        content: '**可用命令:**\n• `/help` - 显示帮助\n• `/analyze` - 分析当前文件\n• `/clear` - 清除控制台\n• `/settings` - 打开设置',
        timestamp: new Date()
      });
    } else if (cmd === '/analyze') {
      this.eventBus.emit('axon:analyze-current-file', {});
    } else if (cmd === '/clear') {
      this.consoleOutput.clear();
    } else if (cmd === '/settings') {
      // @ts-ignore
      this.app.setting.open();
      // @ts-ignore
      this.app.setting.openTabById('axon');
    } else {
      this.consoleOutput.addMessage({
        type: 'system',
        content: `未知命令: ${content}`,
        timestamp: new Date()
      });
    }
  }

  private async getCurrentFileContent(): Promise<string | undefined> {
    const file = this.fileOperations.getActiveFile();
    if (!file || file.extension !== 'md') {
      return undefined;
    }

    try {
      return await this.app.vault.read(file);
    } catch {
      return undefined;
    }
  }

  private async handleAppendToNote(content: string): Promise<void> {
    try {
      await this.fileOperations.appendToCurrentFile(content);
    } catch (error) {
      this.consoleOutput.addMessage({
        type: 'error',
        content: (error as Error).message,
        timestamp: new Date()
      });
    }
  }

  private async handleSaveNote(conversation: ConversationData): Promise<void> {
    try {
      await this.fileOperations.createChatNote(conversation);
    } catch (error) {
      this.consoleOutput.addMessage({
        type: 'error',
        content: (error as Error).message,
        timestamp: new Date()
      });
    }
  }

  private async handleReplaceSelection(content: string, originalSelection: string): Promise<void> {
    try {
      await this.fileOperations.replaceSelection(content, originalSelection);
    } catch (error) {
      this.consoleOutput.addMessage({
        type: 'error',
        content: (error as Error).message,
        timestamp: new Date()
      });
    }
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.inputPanel.setEnabled(!loading);
    this.inputPanel.setLoading(loading);
  }

  private setupFileContext(): void {
    this.fileContext.onFileChange((data) => {
      if (data.file) {
        this.consoleOutput.addMessage({
          type: 'system',
          content: `📂 已切换到: ${data.file.name}`,
          timestamp: new Date()
        });
      }
      // 文件切换时更新选区状态
      this.selectionContext.updateState();
      this.updateContextIndicator();
    });
    this.fileContext.startWatching();
  }

  private async handleAnalyzeCurrentFile(): Promise<void> {
    try {
      let file = null;
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView && activeView.file) {
        file = activeView.file;
      }
      if (!file) {
        file = this.app.workspace.getActiveFile();
      }
      
      if (!file) {
        this.consoleOutput.addMessage({
          type: 'error',
          content: '请先打开一个 Markdown 文件',
          timestamp: new Date()
        });
        return;
      }

      if (!this.fileAnalyzer.isMarkdownFile(file)) {
        this.consoleOutput.addMessage({
          type: 'error',
          content: '仅支持 Markdown 文件分析',
          timestamp: new Date()
        });
        return;
      }

      const result = await this.fileAnalyzer.analyzeFile(file);
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

  async onClose(): Promise<void> {
    // 清理选区更新定时器
    if (this.selectionUpdateInterval !== null) {
      window.clearInterval(this.selectionUpdateInterval);
      this.selectionUpdateInterval = null;
    }
    
    this.selectionContext.clearCallbacks();
    this.fileContext.stopWatching();
    this.fileContext.clearCallbacks();
    this.eventBus.clear();
  }

  clearConsole(): void {
    this.consoleOutput.clear();
  }
}
