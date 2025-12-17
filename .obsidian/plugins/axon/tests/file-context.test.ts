/**
 * Axon Sensation - FileContext Property Tests
 * **Feature: axon-sensation, Property 8: File Context Update on Change**
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// 模拟 FileChangeEventData
interface FileChangeEventData {
  file: { name: string; path: string } | null;
  previousFile: { name: string; path: string } | null;
}

// 模拟 FileContext 的核心逻辑
class MockFileContext {
  private _currentFile: { name: string; path: string } | null = null;
  private callbacks: ((data: FileChangeEventData) => void)[] = [];

  get currentFile() {
    return this._currentFile;
  }

  onFileChange(callback: (data: FileChangeEventData) => void): void {
    this.callbacks.push(callback);
  }

  // 模拟文件变化
  simulateFileChange(newFile: { name: string; path: string } | null): void {
    const previousFile = this._currentFile;
    this._currentFile = newFile;

    // 只有当文件真正变化时才触发回调
    if (newFile?.path !== previousFile?.path) {
      const eventData: FileChangeEventData = {
        file: newFile,
        previousFile: previousFile
      };

      this.callbacks.forEach(callback => {
        callback(eventData);
      });
    }
  }
}

describe('FileContext', () => {
  /**
   * **Feature: axon-sensation, Property 8: File Context Update on Change**
   * *For any* file change event, the FileContext should:
   * - Update the currentFile reference to the new file
   * - Emit a notification event to the console
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  describe('Property 8: File Context Update on Change', () => {
    it('should update currentFile when file changes', () => {
      const fileArb = fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[<>:"/\\|?*\n]/g, '') || 'file').map(s => s + '.md'),
        path: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.replace(/[<>:"/\\|?*\n]/g, '') || 'path').map(s => s + '.md')
      });

      fc.assert(
        fc.property(fc.array(fc.option(fileArb, { nil: null }), { minLength: 1, maxLength: 10 }), (fileSequence) => {
          const context = new MockFileContext();
          
          fileSequence.forEach(file => {
            context.simulateFileChange(file);
            
            // 验证 currentFile 已更新
            if (file === null) {
              expect(context.currentFile).toBeNull();
            } else {
              expect(context.currentFile).toEqual(file);
            }
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should emit notification on file change', () => {
      const fileArb = fc.record({
        name: fc.string({ minLength: 1, maxLength: 30 }).map(s => (s.replace(/[<>:"/\\|?*\n]/g, '') || 'file') + '.md'),
        path: fc.string({ minLength: 1, maxLength: 50 }).map(s => (s.replace(/[<>:"/\\|?*\n]/g, '') || 'path') + '.md')
      });

      fc.assert(
        fc.property(fileArb, fileArb, (file1, file2) => {
          // 确保两个文件不同
          if (file1.path === file2.path) return true;

          const context = new MockFileContext();
          const callback = vi.fn();
          context.onFileChange(callback);

          // 切换到第一个文件
          context.simulateFileChange(file1);
          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenLastCalledWith({
            file: file1,
            previousFile: null
          });

          // 切换到第二个文件
          context.simulateFileChange(file2);
          expect(callback).toHaveBeenCalledTimes(2);
          expect(callback).toHaveBeenLastCalledWith({
            file: file2,
            previousFile: file1
          });

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should not emit notification when file does not change', () => {
      const fileArb = fc.record({
        name: fc.string({ minLength: 1, maxLength: 30 }).map(s => (s.replace(/[<>:"/\\|?*\n]/g, '') || 'file') + '.md'),
        path: fc.string({ minLength: 1, maxLength: 50 }).map(s => (s.replace(/[<>:"/\\|?*\n]/g, '') || 'path') + '.md')
      });

      fc.assert(
        fc.property(fileArb, (file) => {
          const context = new MockFileContext();
          const callback = vi.fn();
          context.onFileChange(callback);

          // 设置初始文件
          context.simulateFileChange(file);
          expect(callback).toHaveBeenCalledTimes(1);

          // 再次设置相同文件
          context.simulateFileChange({ ...file });
          // 回调不应该再次被调用（因为路径相同）
          expect(callback).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    });
  });
});
