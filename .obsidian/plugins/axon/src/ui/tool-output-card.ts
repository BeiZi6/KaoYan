/**
 * Axon MCP - Tool Output Card
 * 工具执行结果显示组件
 */

import { ToolResult, ToolCall } from '../core/tool-manager';

/** 工具输出数据 */
export interface ToolOutputData {
  toolName: string;
  params: Record<string, unknown>;
  result: ToolResult;
  timestamp: Date;
}

export class ToolOutputCard {
  private container: HTMLElement | null = null;
  private loadingEl: HTMLElement | null = null;
  private resultEl: HTMLElement | null = null;

  /** 渲染工具输出卡片 */
  render(container: HTMLElement, data: ToolOutputData): HTMLElement {
    this.container = container.createDiv({ cls: 'axon-tool-output' });

    // 头部：工具名称和时间
    const header = this.container.createDiv({ cls: 'axon-tool-output-header' });
    
    const icon = header.createSpan({ cls: 'axon-tool-output-icon' });
    icon.textContent = '⚡';
    
    const title = header.createSpan({ cls: 'axon-tool-output-title' });
    title.textContent = `Tool: ${data.toolName}`;
    
    const time = header.createSpan({ cls: 'axon-tool-output-time' });
    time.textContent = this.formatTime(data.timestamp);

    // 参数显示
    const paramsEl = this.container.createDiv({ cls: 'axon-tool-output-params' });
    paramsEl.createEl('strong', { text: 'Parameters:' });
    const paramsCode = paramsEl.createEl('pre');
    paramsCode.createEl('code', { 
      text: JSON.stringify(data.params, null, 2) 
    });

    // 结果显示
    this.resultEl = this.container.createDiv({ cls: 'axon-tool-output-result' });
    this.renderResult(data.result);

    return this.container;
  }

  /** 渲染加载状态 */
  renderLoading(container: HTMLElement, toolCall: ToolCall): HTMLElement {
    this.container = container.createDiv({ cls: 'axon-tool-output axon-tool-output-loading' });

    // 头部
    const header = this.container.createDiv({ cls: 'axon-tool-output-header' });
    
    const icon = header.createSpan({ cls: 'axon-tool-output-icon' });
    icon.textContent = '⚡';
    
    const title = header.createSpan({ cls: 'axon-tool-output-title' });
    title.textContent = `Tool: ${toolCall.tool}`;

    // 加载指示器
    this.loadingEl = this.container.createDiv({ cls: 'axon-tool-output-spinner' });
    this.loadingEl.createSpan({ cls: 'axon-spinner' });
    this.loadingEl.createSpan({ text: ' Executing...' });

    // 参数显示
    const paramsEl = this.container.createDiv({ cls: 'axon-tool-output-params' });
    paramsEl.createEl('strong', { text: 'Parameters:' });
    const paramsCode = paramsEl.createEl('pre');
    paramsCode.createEl('code', { 
      text: JSON.stringify(toolCall.params, null, 2) 
    });

    // 结果占位
    this.resultEl = this.container.createDiv({ cls: 'axon-tool-output-result' });

    return this.container;
  }

  /** 更新为完成状态 */
  setComplete(result: ToolResult): void {
    if (!this.container) return;

    // 移除加载状态
    this.container.removeClass('axon-tool-output-loading');
    if (this.loadingEl) {
      this.loadingEl.remove();
      this.loadingEl = null;
    }

    // 添加结果状态类
    if (result.success) {
      this.container.addClass('axon-tool-output-success');
    } else {
      this.container.addClass('axon-tool-output-error');
    }

    // 渲染结果
    if (this.resultEl) {
      this.resultEl.empty();
      this.renderResultContent(this.resultEl, result);
    }
  }

  /** 渲染结果内容 */
  private renderResult(result: ToolResult): void {
    if (!this.resultEl) return;

    // 添加状态类
    if (this.container) {
      if (result.success) {
        this.container.addClass('axon-tool-output-success');
      } else {
        this.container.addClass('axon-tool-output-error');
      }
    }

    this.renderResultContent(this.resultEl, result);
  }

  /** 渲染结果内容到元素 */
  private renderResultContent(el: HTMLElement, result: ToolResult): void {
    const statusEl = el.createDiv({ cls: 'axon-tool-output-status' });
    
    if (result.success) {
      statusEl.createSpan({ text: '✅ Success', cls: 'axon-tool-status-success' });
    } else {
      statusEl.createSpan({ text: '❌ Error', cls: 'axon-tool-status-error' });
    }

    const contentEl = el.createDiv({ cls: 'axon-tool-output-content' });
    const content = result.success ? result.data : result.error;
    
    if (content) {
      // 如果内容较长，使用 pre 标签
      if (content.length > 100 || content.includes('\n')) {
        const pre = contentEl.createEl('pre');
        pre.createEl('code', { text: content });
      } else {
        contentEl.textContent = content;
      }
    }
  }

  /** 格式化时间 */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
