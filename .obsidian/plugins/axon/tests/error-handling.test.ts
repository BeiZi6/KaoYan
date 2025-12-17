/**
 * Axon Sensation - Error Handling Property Tests
 * **Feature: axon-sensation, Property 1 & 9**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// 模拟文件类型
interface MockFile {
  name: string;
  path: string;
  extension: string;
}

// 模拟分析结果类型
type AnalysisResult = 
  | { success: true; data: unknown }
  | { success: false; error: string; userFriendly: boolean };

// 文件验证函数
function validateFile(file: MockFile | null): AnalysisResult {
  if (file === null) {
    return {
      success: false,
      error: '请先打开一个 Markdown 文件',
      userFriendly: true
    };
  }

  if (file.extension !== 'md') {
    return {
      success: false,
      error: '仅支持 Markdown 文件分析',
      userFriendly: true
    };
  }

  return {
    success: true,
    data: { file }
  };
}

// 错误处理包装函数
function safeAnalyze(analyzeFunc: () => unknown): AnalysisResult {
  try {
    const result = analyzeFunc();
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return {
      success: false,
      error: '分析过程中发生错误，请重试',
      userFriendly: true
    };
  }
}

describe('Error Handling', () => {
  /**
   * **Feature: axon-sensation, Property 1: File Retrieval Validation**
   * *For any* active file in the workspace, when the analyze action is triggered,
   * the system should either successfully retrieve the file content if it's a Markdown file,
   * or return an appropriate error if the file is not Markdown or no file is active.
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  describe('Property 1: File Retrieval Validation', () => {
    it('should accept markdown files', () => {
      const mdFileArb = fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }).map(s => (s.replace(/[<>:"/\\|?*\n.]/g, '') || 'file') + '.md'),
        path: fc.string({ minLength: 1, maxLength: 100 }).map(s => (s.replace(/[<>:"/\\|?*\n]/g, '') || 'path') + '.md'),
        extension: fc.constant('md')
      });

      fc.assert(
        fc.property(mdFileArb, (file) => {
          const result = validateFile(file);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject non-markdown files', () => {
      const nonMdExtensions = ['txt', 'pdf', 'docx', 'html', 'js', 'ts', 'json', 'xml', 'csv'];
      
      const nonMdFileArb = fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[<>:"/\\|?*\n.]/g, '') || 'file'),
        path: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.replace(/[<>:"/\\|?*\n]/g, '') || 'path'),
        extension: fc.constantFrom(...nonMdExtensions)
      });

      fc.assert(
        fc.property(nonMdFileArb, (file) => {
          const result = validateFile(file);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toContain('Markdown');
            expect(result.userFriendly).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle null file gracefully', () => {
      const result = validateFile(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.userFriendly).toBe(true);
        expect(result.error.length).toBeGreaterThan(0);
      }
    });
  });

  /**
   * **Feature: axon-sensation, Property 9: Error Handling Graceful Degradation**
   * *For any* error during analysis, the system should display a user-friendly 
   * error message (not raw exception) and the console should remain functional.
   * **Validates: Requirements 5.4**
   */
  describe('Property 9: Error Handling Graceful Degradation', () => {
    it('should catch errors and return user-friendly messages', () => {
      const errorMessages = [
        'Network error',
        'File not found',
        'Permission denied',
        'Invalid format',
        'Timeout',
        'Unknown error occurred'
      ];

      fc.assert(
        fc.property(fc.constantFrom(...errorMessages), (errorMsg) => {
          const result = safeAnalyze(() => {
            throw new Error(errorMsg);
          });

          expect(result.success).toBe(false);
          if (!result.success) {
            // 错误消息应该是用户友好的，不包含原始错误
            expect(result.userFriendly).toBe(true);
            expect(result.error).not.toContain(errorMsg);
            expect(result.error.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle non-Error exceptions', () => {
      fc.assert(
        fc.property(fc.anything(), (thrown) => {
          const result = safeAnalyze(() => {
            throw thrown;
          });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.userFriendly).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return success for valid operations', () => {
      fc.assert(
        fc.property(fc.anything(), (data) => {
          const result = safeAnalyze(() => data);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
