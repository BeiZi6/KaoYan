/**
 * Axon MCP - ExecutionLoop Property Tests
 * 使用 fast-check 进行属性测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ExecutionLoop, AIService, ToolExecution } from '../src/core/execution-loop';
import { ToolManager, ToolCall, ToolResult } from '../src/core/tool-manager';
import { ToolParser } from '../src/core/tool-parser';
import { App } from 'obsidian';

// Mock AI Service
const createMockAIService = (responses: string[]): AIService => {
  let callIndex = 0;
  return {
    chatWithHistory: async () => {
      const response = responses[callIndex] || 'No more responses';
      callIndex++;
      return response;
    }
  };
};

// Mock ToolManager that tracks execution order
const createMockToolManager = (): ToolManager & { executionOrder: string[] } => {
  const executionOrder: string[] = [];
  const mockApp = new App();
  const tm = new ToolManager(mockApp);
  
  // Override execute to track order
  const originalExecute = tm.execute.bind(tm);
  tm.execute = async (toolCall: ToolCall): Promise<ToolResult> => {
    executionOrder.push(toolCall.tool);
    return { success: true, data: `Executed ${toolCall.tool}` };
  };
  
  return Object.assign(tm, { executionOrder });
};

describe('ExecutionLoop Property Tests', () => {
  /**
   * **Feature: axon-mcp, Property 13: Multiple tool calls execute in order**
   * **Validates: Requirements 5.5**
   */
  describe('Property 13: Multiple tool calls execute in order', () => {
    it('should execute tools in the order they appear in the response', async () => {
      // Generate random tool sequences
      const toolSequences = [
        ['read_note', 'create_note', 'list_folder'],
        ['list_folder', 'read_note'],
        ['create_note', 'read_note', 'list_folder', 'read_note']
      ];

      for (const sequence of toolSequences) {
        const toolCalls = sequence.map(tool => ({
          tool,
          params: tool === 'create_note' 
            ? { path: 'test.md', content: 'test' }
            : { path: 'test.md' }
        }));

        // Create response with multiple tool blocks
        const response = toolCalls
          .map(tc => `\`\`\`json:tool\n${JSON.stringify(tc)}\n\`\`\``)
          .join('\n\n');

        const mockTM = createMockToolManager();
        const parser = new ToolParser();
        const aiService = createMockAIService([response, 'Final response']);

        const loop = new ExecutionLoop(mockTM, parser, aiService);
        
        await loop.run({
          originalMessage: 'test',
          conversationHistory: [],
          maxIterations: 5
        });

        // Verify execution order matches the sequence
        expect(mockTM.executionOrder).toEqual(sequence);
      }
    });

    it('should maintain order with property-based testing', async () => {
      const toolNameArb = fc.constantFrom('read_note', 'create_note', 'list_folder');
      const sequenceArb = fc.array(toolNameArb, { minLength: 1, maxLength: 5 });

      await fc.assert(
        fc.asyncProperty(sequenceArb, async (sequence) => {
          const toolCalls = sequence.map(tool => ({
            tool,
            params: tool === 'create_note' 
              ? { path: 'test.md', content: 'test' }
              : { path: 'test.md' }
          }));

          const response = toolCalls
            .map(tc => `\`\`\`json:tool\n${JSON.stringify(tc)}\n\`\`\``)
            .join('\n');

          const mockTM = createMockToolManager();
          const parser = new ToolParser();
          const aiService = createMockAIService([response, 'Done']);

          const loop = new ExecutionLoop(mockTM, parser, aiService);
          
          await loop.run({
            originalMessage: 'test',
            conversationHistory: [],
            maxIterations: 5
          });

          expect(mockTM.executionOrder).toEqual(sequence);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: axon-mcp, Property 15: Undefined tool returns error**
   * **Validates: Requirements 7.2**
   */
  describe('Property 15: Undefined tool returns error', () => {
    const undefinedToolArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => !['read_note', 'create_note', 'list_folder'].includes(s) && /^[a-z_]+$/.test(s));

    it('should return error for undefined tools', async () => {
      await fc.assert(
        fc.asyncProperty(undefinedToolArb, async (toolName) => {
          const toolCall = { tool: toolName, params: {} };
          const response = `\`\`\`json:tool\n${JSON.stringify(toolCall)}\n\`\`\``;

          const mockApp = new App();
          const toolManager = new ToolManager(mockApp);
          const parser = new ToolParser();
          const aiService = createMockAIService([response, 'Done']);

          const loop = new ExecutionLoop(toolManager, parser, aiService);
          const executions: ToolExecution[] = [];
          
          loop.setOnToolExecution((exec) => {
            executions.push(exec);
          });

          await loop.run({
            originalMessage: 'test',
            conversationHistory: [],
            maxIterations: 5
          });

          // Should have one execution with error
          expect(executions.length).toBe(1);
          expect(executions[0].result.success).toBe(false);
          expect(executions[0].result.error).toContain('not found');
        }),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Additional: Max iterations limit
   */
  describe('Max iterations limit', () => {
    it('should stop after max iterations', async () => {
      // AI always returns tool calls, never stops
      const infiniteToolResponse = '```json:tool\n{"tool": "read_note", "params": {"path": "test.md"}}\n```';
      
      const mockTM = createMockToolManager();
      const parser = new ToolParser();
      
      // Create AI service that always returns tool calls
      let callCount = 0;
      const aiService: AIService = {
        chatWithHistory: async () => {
          callCount++;
          return infiniteToolResponse;
        }
      };

      const loop = new ExecutionLoop(mockTM, parser, aiService);
      
      const result = await loop.run({
        originalMessage: 'test',
        conversationHistory: [],
        maxIterations: 3
      });

      expect(result.reachedMaxIterations).toBe(true);
      expect(result.iterationCount).toBe(3);
    });
  });

  /**
   * Additional: No tool calls returns immediately
   */
  describe('No tool calls', () => {
    it('should return immediately when no tool calls in response', async () => {
      const plainResponse = 'This is a plain text response without any tool calls.';
      
      const mockTM = createMockToolManager();
      const parser = new ToolParser();
      const aiService = createMockAIService([plainResponse]);

      const loop = new ExecutionLoop(mockTM, parser, aiService);
      
      const result = await loop.run({
        originalMessage: 'test',
        conversationHistory: [],
        maxIterations: 10
      });

      expect(result.finalResponse).toBe(plainResponse);
      expect(result.toolExecutions.length).toBe(0);
      expect(result.iterationCount).toBe(1);
      expect(result.reachedMaxIterations).toBe(false);
    });
  });
});
