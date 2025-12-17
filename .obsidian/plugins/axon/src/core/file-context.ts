/**
 * Axon Sensation - File Context Module
 * 管理当前文件上下文和文件切换检测
 */

import { App, TFile, MarkdownView, WorkspaceLeaf } from 'obsidian';
import { FileChangeEventData, EventCallback } from './types';

export class FileContext {
  private app: App;
  private _currentFile: TFile | null = null;
  private callbacks: EventCallback<FileChangeEventData>[] = [];
  private eventRef: ReturnType<typeof this.app.workspace.on> | null = null;

  constructor(app: App) {
    this.app = app;
  }

  /** 获取当前文件 */
  get currentFile(): TFile | null {
    return this._currentFile;
  }

  /** 开始监听文件变化 */
  startWatching(): void {
    // 初始化当前文件
    this.updateCurrentFile();

    // 监听活动叶子变化
    this.eventRef = this.app.workspace.on('active-leaf-change', (leaf: WorkspaceLeaf | null) => {
      this.handleLeafChange(leaf);
    });
  }

  /** 停止监听 */
  stopWatching(): void {
    if (this.eventRef) {
      this.app.workspace.offref(this.eventRef);
      this.eventRef = null;
    }
  }

  /** 注册文件变化回调 */
  onFileChange(callback: EventCallback<FileChangeEventData>): void {
    this.callbacks.push(callback);
  }

  /** 移除回调 */
  offFileChange(callback: EventCallback<FileChangeEventData>): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /** 清除所有回调 */
  clearCallbacks(): void {
    this.callbacks = [];
  }

  /** 处理叶子变化 */
  private handleLeafChange(leaf: WorkspaceLeaf | null): void {
    const previousFile = this._currentFile;
    this.updateCurrentFile();

    // 只有当文件真正变化时才触发回调
    if (this._currentFile?.path !== previousFile?.path) {
      this.notifyCallbacks(previousFile);
    }
  }

  /** 更新当前文件引用 */
  private updateCurrentFile(): void {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    this._currentFile = activeView?.file || null;
  }

  /** 通知所有回调 */
  private notifyCallbacks(previousFile: TFile | null): void {
    const eventData: FileChangeEventData = {
      file: this._currentFile ? {
        name: this._currentFile.name,
        path: this._currentFile.path
      } : null,
      previousFile: previousFile ? {
        name: previousFile.name,
        path: previousFile.path
      } : null
    };

    this.callbacks.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error('FileContext callback error:', error);
      }
    });
  }
}
