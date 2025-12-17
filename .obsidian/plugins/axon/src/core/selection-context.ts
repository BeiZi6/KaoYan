/**
 * Axon Precision - Selection Context Module
 * 管理选区状态和上下文模式
 */

import { App, MarkdownView, Editor } from 'obsidian';
import { ContextMode, SelectionState } from './types';

export class SelectionContext {
  private app: App;
  private _state: SelectionState;
  private updateCallbacks: ((state: SelectionState) => void)[] = [];

  constructor(app: App) {
    this.app = app;
    this._state = {
      mode: 'noFile',
      selectedText: null,
      originalSelection: null,
      timestamp: Date.now()
    };
  }

  /** 获取当前状态 */
  get state(): SelectionState {
    return { ...this._state };
  }

  /** 获取当前模式 */
  get mode(): ContextMode {
    return this._state.mode;
  }

  /** 获取选中的文本 */
  get selectedText(): string | null {
    return this._state.selectedText;
  }

  /** 更新选区状态 */
  updateState(): void {
    const editor = this.getActiveEditor();
    
    if (!editor) {
      this._state = {
        mode: 'noFile',
        selectedText: null,
        originalSelection: null,
        timestamp: Date.now()
      };
    } else {
      const selection = editor.getSelection();
      
      if (selection && selection.trim().length > 0) {
        this._state = {
          mode: 'selection',
          selectedText: selection,
          originalSelection: selection,
          timestamp: Date.now()
        };
      } else {
        this._state = {
          mode: 'fullNote',
          selectedText: null,
          originalSelection: null,
          timestamp: Date.now()
        };
      }
    }

    this.notifyCallbacks();
  }

  /** 检查是否有有效选区 */
  hasValidSelection(): boolean {
    return this._state.mode === 'selection' && 
           this._state.selectedText !== null && 
           this._state.selectedText.trim().length > 0;
  }

  /** 获取 AI 请求的上下文 */
  getContextForAI(): string | undefined {
    if (this._state.mode === 'selection' && this._state.selectedText) {
      return this._state.selectedText;
    }
    
    // Full note mode - 返回 undefined，让调用者获取全文
    return undefined;
  }

  /** 验证当前选区是否与原始选区匹配 */
  validateSelection(originalSelection: string): boolean {
    const editor = this.getActiveEditor();
    if (!editor) return false;
    
    const currentSelection = editor.getSelection();
    return currentSelection === originalSelection;
  }

  /** 获取活动编辑器 */
  getActiveEditor(): Editor | null {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    return activeView?.editor || null;
  }

  /** 注册状态更新回调 */
  onStateChange(callback: (state: SelectionState) => void): void {
    this.updateCallbacks.push(callback);
  }

  /** 移除回调 */
  offStateChange(callback: (state: SelectionState) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  /** 清除所有回调 */
  clearCallbacks(): void {
    this.updateCallbacks = [];
  }

  /** 通知所有回调 */
  private notifyCallbacks(): void {
    const state = this.state;
    this.updateCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('SelectionContext callback error:', error);
      }
    });
  }

  /** 获取模式显示文本 */
  static getModeDisplayText(mode: ContextMode): string {
    switch (mode) {
      case 'selection':
        return '🔍 Focused on Selection';
      case 'fullNote':
        return '📄 Full Note Context';
      case 'noFile':
        return '⚠️ No file open';
    }
  }
}
