/**
 * Axon Precision - Context Indicator UI Component
 * 显示当前上下文模式的指示器
 */

import { ContextMode } from '../core/types';
import { SelectionContext } from '../core/selection-context';

export class ContextIndicator {
  private container: HTMLElement | null = null;
  private textEl: HTMLElement | null = null;
  private currentMode: ContextMode = 'noFile';

  render(container: HTMLElement): HTMLElement {
    this.container = container.createDiv({ cls: 'axon-context-indicator' });
    
    this.textEl = this.container.createSpan({ cls: 'axon-context-text' });
    this.updateDisplay(this.currentMode);
    
    return this.container;
  }

  updateMode(mode: ContextMode, selectionLength?: number): void {
    this.currentMode = mode;
    this.updateDisplay(mode, selectionLength);
  }

  private updateDisplay(mode: ContextMode, selectionLength?: number): void {
    if (!this.container || !this.textEl) return;

    // 移除所有模式类
    this.container.removeClass('axon-context-selection');
    this.container.removeClass('axon-context-fullnote');
    this.container.removeClass('axon-context-nofile');

    // 设置文本和样式
    switch (mode) {
      case 'selection':
        this.textEl.textContent = selectionLength 
          ? `🔍 Focused on Selection (${selectionLength} chars)`
          : '🔍 Focused on Selection';
        this.container.addClass('axon-context-selection');
        break;
      case 'fullNote':
        this.textEl.textContent = '📄 Full Note Context';
        this.container.addClass('axon-context-fullnote');
        break;
      case 'noFile':
        this.textEl.textContent = '⚠️ No file open';
        this.container.addClass('axon-context-nofile');
        break;
    }
  }

  getMode(): ContextMode {
    return this.currentMode;
  }
}
