/**
 * Axon - File Operations
 * 文件操作服务
 */

import { App, TFile, MarkdownView, Notice } from 'obsidian';
import { ConversationData } from './types';

export class FileOperations {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /** 获取当前活动文件 */
  getActiveFile(): TFile | null {
    // 尝试从 MarkdownView 获取
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView && activeView.file) {
      return activeView.file;
    }

    // 尝试从 workspace 获取
    return this.app.workspace.getActiveFile();
  }

  /** 追加内容到当前文件 */
  async appendToCurrentFile(content: string): Promise<void> {
    const file = this.getActiveFile();
    
    if (!file) {
      throw new Error('请先打开一个笔记文件');
    }

    if (file.extension !== 'md') {
      throw new Error('只能追加到 Markdown 文件');
    }

    try {
      const currentContent = await this.app.vault.read(file);
      const separator = '\n\n---\n\n## Axon AI 回复\n\n';
      const newContent = currentContent + separator + content + '\n';
      
      await this.app.vault.modify(file, newContent);
      new Notice('✅ 已追加到当前笔记');
    } catch (error) {
      console.error('File append error:', error);
      throw new Error('文件写入失败，请重试');
    }
  }

  /** 创建聊天笔记 */
  async createChatNote(conversation: ConversationData): Promise<TFile> {
    const timestamp = this.formatTimestamp(conversation.timestamp);
    const fileName = `Axon-Chat-${timestamp}.md`;
    
    const content = this.formatConversation(conversation);
    
    try {
      // 检查文件是否已存在
      const existingFile = this.app.vault.getAbstractFileByPath(fileName);
      if (existingFile) {
        // 添加随机后缀避免冲突
        const uniqueFileName = `Axon-Chat-${timestamp}-${Math.random().toString(36).substr(2, 4)}.md`;
        const file = await this.app.vault.create(uniqueFileName, content);
        new Notice(`✅ 已保存到 ${uniqueFileName}`);
        return file;
      }
      
      const file = await this.app.vault.create(fileName, content);
      new Notice(`✅ 已保存到 ${fileName}`);
      return file;
    } catch (error) {
      console.error('File creation error:', error);
      throw new Error('创建笔记失败，请重试');
    }
  }

  /** 获取当前选区 */
  getCurrentSelection(): string | null {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor) {
      return null;
    }
    
    const selection = activeView.editor.getSelection();
    return selection && selection.trim().length > 0 ? selection : null;
  }

  /** 检查是否有选区 */
  hasSelection(): boolean {
    return this.getCurrentSelection() !== null;
  }

  /** 替换选区内容 */
  async replaceSelection(content: string, originalSelection: string): Promise<void> {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    
    if (!activeView || !activeView.editor) {
      throw new Error('请先打开一个笔记文件');
    }

    const editor = activeView.editor;
    const currentSelection = editor.getSelection();

    // 验证选区是否仍然有效
    if (!currentSelection || currentSelection.trim().length === 0) {
      throw new Error('选区已丢失，无法替换');
    }

    // 验证选区内容是否匹配
    if (currentSelection !== originalSelection) {
      throw new Error('选区内容已更改，无法替换');
    }

    try {
      editor.replaceSelection(content);
      new Notice('✅ 已替换选中内容');
    } catch (error) {
      console.error('Replace selection error:', error);
      throw new Error('替换失败，请重试');
    }
  }

  /** 格式化时间戳 */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /** 格式化对话内容 */
  private formatConversation(conversation: ConversationData): string {
    const lines: string[] = [
      '---',
      'tags: [axon-chat]',
      `date: ${conversation.timestamp.toISOString()}`,
      '---',
      '',
      '# Axon 对话记录',
      '',
      `> 创建时间: ${conversation.timestamp.toLocaleString('zh-CN')}`,
      ''
    ];

    if (conversation.context) {
      lines.push('## 笔记上下文');
      lines.push('');
      lines.push('```');
      lines.push(conversation.context.substring(0, 500) + (conversation.context.length > 500 ? '...' : ''));
      lines.push('```');
      lines.push('');
    }

    lines.push('## 用户问题');
    lines.push('');
    lines.push(conversation.userMessage);
    lines.push('');
    lines.push('## Axon 回复');
    lines.push('');
    lines.push(conversation.aiResponse);
    lines.push('');

    return lines.join('\n');
  }
}
