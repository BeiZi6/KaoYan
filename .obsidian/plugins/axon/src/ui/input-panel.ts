/**
 * Axon - Input Panel Component
 * 用户输入面板
 */

import { SimpleEventBus } from '../core/event-bus';
import { ContextIndicator } from './context-indicator';
import { ContextMode } from '../core/types';

export class AxonInputPanel {
  private container!: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private analyzeButton!: HTMLButtonElement;
  private eventBus: SimpleEventBus;
  private contextIndicator: ContextIndicator;

  constructor(eventBus: SimpleEventBus) {
    this.eventBus = eventBus;
    this.contextIndicator = new ContextIndicator();
  }

  render(container: HTMLElement): void {
    this.container = container;
    this.container.addClass('axon-input-panel');

    // Agent Mode 指示器
    const agentModeIndicator = this.container.createDiv({
      cls: 'axon-agent-mode-indicator'
    });
    agentModeIndicator.createSpan({ cls: 'axon-agent-mode-icon', text: '🔓' });
    agentModeIndicator.createSpan({ cls: 'axon-agent-mode-text', text: 'Agent Mode Active' });

    // 上下文指示器
    const indicatorContainer = this.container.createDiv({
      cls: 'axon-indicator-container'
    });
    this.contextIndicator.render(indicatorContainer);

    const inputWrapper = this.container.createDiv({
      cls: 'axon-input-wrapper'
    });

    this.textarea = inputWrapper.createEl('textarea', {
      cls: 'axon-textarea',
      attr: {
        placeholder: '输入您的消息...',
        rows: '3'
      }
    });

    const buttonContainer = inputWrapper.createDiv({
      cls: 'axon-button-container'
    });

    this.analyzeButton = buttonContainer.createEl('button', {
      cls: 'axon-analyze-button',
      text: '🔍 分析'
    });

    this.sendButton = buttonContainer.createEl('button', {
      cls: 'axon-send-button',
      text: '发送'
    });

    this.bindEvents();
  }

  /** 更新上下文模式显示 */
  updateContextMode(mode: ContextMode, selectionLength?: number): void {
    this.contextIndicator.updateMode(mode, selectionLength);
  }

  private bindEvents(): void {
    this.sendButton.addEventListener('click', () => {
      this.handleSend();
    });

    this.analyzeButton.addEventListener('click', () => {
      this.handleAnalyze();
    });

    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.textarea.addEventListener('input', () => {
      this.autoResize();
    });
  }

  private handleSend(): void {
    const content = this.textarea.value.trim();
    if (!content) return;

    this.eventBus.emit('axon:send-message', { content });
    this.textarea.value = '';
    this.resetHeight();
    this.textarea.focus();
  }

  private handleAnalyze(): void {
    this.eventBus.emit('axon:analyze-current-file', {});
  }

  private autoResize(): void {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + 'px';
  }

  private resetHeight(): void {
    this.textarea.style.height = 'auto';
  }

  setEnabled(enabled: boolean): void {
    this.textarea.disabled = !enabled;
    this.sendButton.disabled = !enabled;
    this.analyzeButton.disabled = !enabled;
  }

  setLoading(loading: boolean): void {
    if (loading) {
      this.sendButton.textContent = '⏳ 思考中...';
      this.sendButton.addClass('axon-loading');
    } else {
      this.sendButton.textContent = '发送';
      this.sendButton.removeClass('axon-loading');
    }
  }
}
