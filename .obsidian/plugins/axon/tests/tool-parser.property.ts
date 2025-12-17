/**
 * Axon MCP - ToolParser Property Tests
 * 使用 fast-check 进行属性测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ToolParser } from '../src/core/tool-parser';

describe('ToolParser Property Tests', () => {
  const parser = new ToolParser();

  /**
   * **Feature: axon-mcp, Property 12: Tool block parsing extracts correct data**
   * **Validates: Requirements 5.1**
   */
  describe('Property 12: Tool block parsing extracts correct data', () => {
    // 生成有效的工具名称
    const toolNameArb = fc.constantFrom('read_note', 'create_note', 'list_folder', 'custom_tool');
    
    // 生成有效的参数对象
    const paramsArb = fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
      fc.oneof(fc.string(), fc.integer(), fc.boolean())
    );

    it('should extract tool name and params from valid json:tool blocks', () => {
      fc.assert(
        fc.property(toolNameArb, paramsArb, (toolName, params) => {
          const toolCall = { tool: toolName, params };
          const response = `Some text before\n\`\`\`json:tool\n${JSON.stringify(toolCall, null, 2)}\n\`\`\`\nSome text after`;
          
          const result = parser.parse(response);
          
          expect(result.hasToolCalls).toBe(true);
          expect(result.toolCalls.length).toBe(1);
          expect(result.toolCalls[0].tool).toBe(toolName);
          expect(result.toolCalls[0].params).toEqual(params);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve exact parameter values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string(),
          (path, content) => {
            const toolCall = { 
              tool: 'create_note', 
              params: { path, content } 
            };
            const response = `\`\`\`json:tool\n${JSON.stringify(toolCall)}\n\`\`\``;
            
            const result = parser.parse(response);
            
            expect(result.toolCalls[0].params.path).toBe(path);
            expect(result.toolCalls[0].params.content).toBe(content);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: axon-mcp, Property 14: Malformed JSON handled gracefully**
   * **Validates: Requirements 7.1**
   */
  describe('Property 14: Malformed JSON handled gracefully', () => {
    // 生成无效的 JSON 字符串
    const malformedJsonArb = fc.oneof(
      fc.constant('{invalid json}'),
      fc.constant('{"tool": "test"'),  // 缺少闭合括号
      fc.constant('not json at all'),
      fc.constant('{"tool": }'),  // 无效值
      fc.string().filter(s => {
        try { JSON.parse(s); return false; } catch { return true; }
      })
    );

    it('should return error without throwing for malformed JSON', () => {
      fc.assert(
        fc.property(malformedJsonArb, (malformedJson) => {
          const response = `\`\`\`json:tool\n${malformedJson}\n\`\`\``;
          
          // Should not throw
          const result = parser.parse(response);
          
          // Should have errors
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.hasToolCalls).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it('should include error details for malformed JSON', () => {
      const response = '```json:tool\n{invalid}\n```';
      const result = parser.parse(response);
      
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].type).toBe('malformed_json');
      expect(result.errors[0].message).toContain('Invalid JSON');
    });

    it('should handle missing required fields', () => {
      // Missing tool field
      const response1 = '```json:tool\n{"params": {}}\n```';
      const result1 = parser.parse(response1);
      expect(result1.errors[0].type).toBe('missing_field');
      expect(result1.errors[0].message).toContain('tool');

      // Missing params field
      const response2 = '```json:tool\n{"tool": "test"}\n```';
      const result2 = parser.parse(response2);
      expect(result2.errors[0].type).toBe('missing_field');
      expect(result2.errors[0].message).toContain('params');
    });
  });

  /**
   * **Feature: axon-mcp, Property 16: Mixed response text extraction**
   * **Validates: Requirements 7.5**
   */
  describe('Property 16: Mixed response text extraction', () => {
    const textArb = fc.string({ minLength: 1, maxLength: 200 })
      .filter(s => !s.includes('```'));

    it('should preserve text before tool blocks', () => {
      fc.assert(
        fc.property(textArb, (textBefore) => {
          const toolCall = { tool: 'read_note', params: { path: 'test.md' } };
          const response = `${textBefore}\n\`\`\`json:tool\n${JSON.stringify(toolCall)}\n\`\`\``;
          
          const result = parser.parse(response);
          
          expect(result.textContent).toContain(textBefore.trim());
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve text after tool blocks', () => {
      fc.assert(
        fc.property(textArb, (textAfter) => {
          const toolCall = { tool: 'read_note', params: { path: 'test.md' } };
          const response = `\`\`\`json:tool\n${JSON.stringify(toolCall)}\n\`\`\`\n${textAfter}`;
          
          const result = parser.parse(response);
          
          expect(result.textContent).toContain(textAfter.trim());
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve text between multiple tool blocks', () => {
      fc.assert(
        fc.property(textArb, textArb, textArb, (text1, text2, text3) => {
          const toolCall1 = { tool: 'read_note', params: { path: 'a.md' } };
          const toolCall2 = { tool: 'read_note', params: { path: 'b.md' } };
          
          const response = [
            text1,
            '```json:tool',
            JSON.stringify(toolCall1),
            '```',
            text2,
            '```json:tool',
            JSON.stringify(toolCall2),
            '```',
            text3
          ].join('\n');
          
          const result = parser.parse(response);
          
          expect(result.toolCalls.length).toBe(2);
          expect(result.textContent).toContain(text1.trim());
          expect(result.textContent).toContain(text2.trim());
          expect(result.textContent).toContain(text3.trim());
        }),
        { numRuns: 30 }
      );
    });

    it('should return full response when no tool blocks present', () => {
      fc.assert(
        fc.property(textArb, (text) => {
          const result = parser.parse(text);
          
          expect(result.hasToolCalls).toBe(false);
          expect(result.textContent).toBe(text.trim());
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional: Multiple tool calls ordering
   */
  describe('Multiple tool calls', () => {
    it('should extract multiple tool calls in order', () => {
      const toolCalls = [
        { tool: 'list_folder', params: { path: '/' } },
        { tool: 'read_note', params: { path: 'test.md' } },
        { tool: 'create_note', params: { path: 'new.md', content: 'hello' } }
      ];

      const response = toolCalls
        .map(tc => `\`\`\`json:tool\n${JSON.stringify(tc)}\n\`\`\``)
        .join('\n\n');

      const result = parser.parse(response);

      expect(result.toolCalls.length).toBe(3);
      expect(result.toolCalls[0].tool).toBe('list_folder');
      expect(result.toolCalls[1].tool).toBe('read_note');
      expect(result.toolCalls[2].tool).toBe('create_note');
    });
  });
});
