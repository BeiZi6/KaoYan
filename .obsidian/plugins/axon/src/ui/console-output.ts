/**
 * Axon - Console Output Component
 * 控制台输出组件
 */

import { SimpleEventBus } from '../core/event-bus';
import { ConsoleMessage, FileAnalysisResult } from '../core/types';
import { InsightCard } from './insight-card';

export class AxonConsoleOutput {
  private container!: HTMLElement;
  private messagesContainer!: HTMLElement;
  private eventBus: SimpleEventBus;
  private messages: ConsoleMessage[] = [];

  constructor(eventBus: SimpleEventBus) {
    this.eventBus = eventBus;
  }

  render(container: HTMLElement): void {
    this.container = container;
    this.container.addClass('axon-console-output');

    const header = this.container.createDiv({
      cls: 'axon-console-header'
    });

    header.createEl('h4', {
      text: '控制台输出',
      cls: 'axon-console-title'
    });

    const clearButton = header.createEl('button', {
      cls: 'axon-clear-button',
      text: '清除'
    });

    clearButton.addEventListener('click', () => {
      this.eventBus.emit('axon:clear-console');
    });

    this.messagesContainer = this.container.createDiv({
      cls: 'axon-messages-container'
    });

    this.addWelcomeMessage();
  }

  private addWelcomeMessage(): void {
    this.addMessage({
      id: 'welcome',
      type: 'system',
      content: '欢迎使用 Axon！您的 AI Agent 已准备就绪。点击 🔍 分析 按钮来分析当前笔记。',
      timestamp: new Date()
    });
  }

  addMessage(message: ConsoleMessage): void {
    this.messages.push(message);
    const messageEl = this.createMessageElement(message);
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }


  /** 添加文件分析卡片 */
  addInsightCard(data: FileAnalysisResult): void {
    const cardContainer = this.messagesContainer.createDiv({
      cls: 'axon-message axon-message-analysis'
    });

    const header = cardContainer.createDiv({
      cls: 'axon-message-header'
    });

    header.createEl('span', {
      cls: 'axon-message-type',
      text: '📊 分析结果'
    });

    header.createEl('span', {
      cls: 'axon-message-timestamp',
      text: this.formatTimestamp(data.analyzedAt)
    });

    const card = new InsightCard(data);
    card.render(cardContainer);

    this.scrollToBottom();
  }

  clear(): void {
    this.messages = [];
    this.messagesContainer.empty();
    this.addWelcomeMessage();
  }

  private createMessageElement(message: ConsoleMessage): HTMLElement {
    const messageEl = this.messagesContainer.createDiv({
      cls: `axon-message axon-message-${message.type}`
    });

    const header = messageEl.createDiv({
      cls: 'axon-message-header'
    });

    header.createEl('span', {
      cls: 'axon-message-type',
      text: this.getTypeLabel(message.type)
    });

    header.createEl('span', {
      cls: 'axon-message-timestamp',
      text: this.formatTimestamp(message.timestamp)
    });

    const content = messageEl.createDiv({
      cls: 'axon-message-content'
    });

    content.innerHTML = this.parseSimpleFormatting(message.content);

    return messageEl;
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      user: '用户',
      assistant: 'Axon',
      system: '系统',
      error: '错误',
      analysis: '分析'
    };
    return labels[type] || type;
  }

  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private parseSimpleFormatting(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  private scrollToBottom(): void {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}
