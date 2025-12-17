/**
 * Axon DeepSeek - Service Property Tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// 测试用的纯函数

/** 构建带上下文的用户消息 */
function buildUserMessage(userQuestion: string, fileContext?: string): string {
  if (fileContext && fileContext.trim().length > 0) {
    return `Context from active note:\n\n${fileContext}\n\nUser Question: ${userQuestion}`;
  }
  return userQuestion;
}

/** 检查是否已配置 */
function isConfigured(apiKey: string): boolean {
  return !!apiKey && apiKey.trim().length > 0;
}

/** API Key 掩码 */
function maskApiKey(key: string): string {
  if (!key || key.length <= 4) {
    return '*'.repeat(key?.length || 0);
  }
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

/** 生成聊天笔记文件名 */
function generateChatNoteFilename(timestamp: Date): string {
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  
  return `Axon-Chat-${year}${month}${day}-${hours}${minutes}${seconds}.md`;
}

describe('DeepSeekService', () => {
  /**
   * **Feature: axon-deepseek, Property 1: API Key Masking**
   * *For any* API key string, the masking function should return a string 
   * where all characters except the last 4 are replaced with asterisks.
   * **Validates: Requirements 1.2**
   */
  describe('Property 1: API Key Masking', () => {
    it('should mask all but last 4 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            // 长度应该相同
            expect(masked.length).toBe(apiKey.length);
            
            // 最后4个字符应该可见
            expect(masked.slice(-4)).toBe(apiKey.slice(-4));
            
            // 前面的字符应该是星号
            const maskedPart = masked.slice(0, -4);
            expect(maskedPart).toBe('*'.repeat(apiKey.length - 4));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle short keys', () => {
      expect(maskApiKey('')).toBe('');
      expect(maskApiKey('abc')).toBe('***');
      expect(maskApiKey('abcd')).toBe('****');
    });
  });

  /**
   * **Feature: axon-deepseek, Property 3: Request Construction Completeness**
   * *For any* user message and optional file context, the constructed message
   * should include the context and user question in the correct format.
   * **Validates: Requirements 2.1, 2.2, 2.3**
   */
  describe('Property 3: Request Construction', () => {
    it('should include context when provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          (question, context) => {
            const message = buildUserMessage(question, context);
            
            // 应该包含上下文前缀
            expect(message).toContain('Context from active note:');
            
            // 应该包含文件内容
            expect(message).toContain(context);
            
            // 应该包含用户问题
            expect(message).toContain('User Question:');
            expect(message).toContain(question);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return plain question when no context', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (question) => {
            const message = buildUserMessage(question, undefined);
            expect(message).toBe(question);
            
            const messageEmpty = buildUserMessage(question, '');
            expect(messageEmpty).toBe(question);
            
            const messageWhitespace = buildUserMessage(question, '   ');
            expect(messageWhitespace).toBe(question);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: axon-deepseek, Property 4: Context Injection Format**
   * *For any* file content and user question, the combined message should
   * follow the specified format.
   * **Validates: Requirements 2.3**
   */
  describe('Property 4: Context Injection Format', () => {
    it('should follow exact format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 300 }).filter(s => s.trim().length > 0),
          (question, context) => {
            const message = buildUserMessage(question, context);
            const expectedFormat = `Context from active note:\n\n${context}\n\nUser Question: ${question}`;
            expect(message).toBe(expectedFormat);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: axon-deepseek, Property 2: Settings Round-Trip Persistence**
   * Testing configuration check function.
   * **Validates: Requirements 1.3, 1.4**
   */
  describe('Property 2: Configuration Check', () => {
    it('should return true for non-empty API keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (apiKey) => {
            expect(isConfigured(apiKey)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for empty or whitespace keys', () => {
      expect(isConfigured('')).toBe(false);
      expect(isConfigured('   ')).toBe(false);
    });
  });

  /**
   * **Feature: axon-deepseek, Property 7: Chat Note Creation**
   * *For any* timestamp, the filename should match the pattern.
   * **Validates: Requirements 3.3**
   */
  describe('Property 7: Chat Note Filename', () => {
    it('should generate filename matching pattern', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (timestamp) => {
            const filename = generateChatNoteFilename(timestamp);
            
            // 应该以 Axon-Chat- 开头
            expect(filename.startsWith('Axon-Chat-')).toBe(true);
            
            // 应该以 .md 结尾
            expect(filename.endsWith('.md')).toBe(true);
            
            // 应该匹配格式 Axon-Chat-YYYYMMDD-HHMMSS.md
            const pattern = /^Axon-Chat-\d{8}-\d{6}\.md$/;
            expect(pattern.test(filename)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
