/**
 * Axon - Actionable Card
 * 带操作按钮的 AI 响应卡片
 */

import { ConversationData } from '../core/types';

export class ActionableCard {
  private data: ConversationData;
  private container: HTMLElement | null = null;
  private onAppend: () => void;
  private onSaveNote: () => void;
  private onReplace?: () => void;

  constructor(
    data: ConversationData,
    onAppend: () => void,
    onSaveNote: () => void,
    onReplace?: () => void
  ) {
    this.data = data;
    this.onAppend = onAppend;
    this.onSaveNote = onSaveNote;
    this.onReplace = onReplace;
  }

  render(container: HTMLElement): HTMLElement {
    this.container = container.createDiv({ cls: 'axon-actionable-card' });
    
    this.renderContent();
    this.renderActions();
    
    return this.container;
  }

  private renderContent(): void {
    if (!this.container) return;

    const contentEl = this.container.createDiv({ cls: 'axon-ai-response-content' });
    
    // 渲染 Markdown 内容
    contentEl.innerHTML = this.renderMarkdown(this.data.aiResponse);
  }

  private renderActions(): void {
    if (!this.container) return;

    const actionsEl = this.container.createDiv({ cls: 'axon-action-buttons' });

    // 根据上下文模式显示不同按钮
    if (this.data.contextMode === 'selection' && this.onReplace) {
      // Selection Mode: Replace + Append
      const replaceBtn = actionsEl.createEl('button', {
        cls: 'axon-action-btn axon-action-replace',
        text: '🔄 替换选区'
      });
      replaceBtn.addEventListener('click', () => {
        this.onReplace?.();
      });

      const appendBtn = actionsEl.createEl('button', {
        cls: 'axon-action-btn axon-action-append-secondary',
        text: '📥 追加'
      });
      appendBtn.addEventListener('click', () => {
        this.onAppend();
      });
    } else {
      // Full Note Mode: Append + Save Note
      const appendBtn = actionsEl.createEl('button', {
        cls: 'axon-action-btn axon-action-append',
        text: '📥 追加到笔记'
      });
      appendBtn.addEventListener('click', () => {
        this.onAppend();
      });

      const saveBtn = actionsEl.createEl('button', {
        cls: 'axon-action-btn axon-action-save',
        text: '📄 保存对话'
      });
      saveBtn.addEventListener('click', () => {
        this.onSaveNote();
      });
    }
  }

  /** 简单的 Markdown 渲染 */
  private renderMarkdown(content: string): string {
    let html = content;
    
    // 代码块 (需要先处理，避免内部内容被其他规则影响)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const langClass = lang ? ` language-${lang}` : '';
      return `<pre class="axon-code-block${langClass}"><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code class="axon-inline-code">$1</code>');
    
    // 粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 斜体
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // 标题
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
    
    // 无序列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 换行
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // 包装段落
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }
    
    return html;
  }

  /** HTML 转义 */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getData(): ConversationData {
    return this.data;
  }
}
