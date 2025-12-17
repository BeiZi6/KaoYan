/**
 * Axon MCP - Tool Parser
 * 解析 AI 响应中的工具调用
 */

import { ToolCall } from './tool-manager';

/** 解析后的响应 */
export interface ParsedResponse {
  textContent: string;
  toolCalls: ToolCall[];
  hasToolCalls: boolean;
  errors: ParseError[];
}

/** 解析错误 */
export interface ParseError {
  type: 'malformed_json' | 'missing_field' | 'invalid_structure';
  message: string;
  rawBlock?: string;
}

/** 工具块匹配结果 */
interface ToolBlockMatch {
  fullMatch: string;
  jsonContent: string;
  startIndex: number;
  endIndex: number;
}

export class ToolParser {
  // 匹配 ```json:tool ... ``` 代码块的正则表达式
  private static readonly TOOL_BLOCK_REGEX = /```json:tool\s*\n([\s\S]*?)```/g;

  /**
   * 解析 AI 响应，提取文本内容和工具调用
   */
  parse(response: string): ParsedResponse {
    const toolBlocks = this.extractToolBlocks(response);
    const toolCalls: ToolCall[] = [];
    const errors: ParseError[] = [];

    // 解析每个工具块
    for (const block of toolBlocks) {
      const result = this.parseToolBlock(block.jsonContent);
      if (result.success && result.toolCall) {
        toolCalls.push(result.toolCall);
      } else if (result.error) {
        errors.push({
          ...result.error,
          rawBlock: block.jsonContent
        });
      }
    }

    // 提取文本内容（移除工具块）
    const textContent = this.extractTextContent(response, toolBlocks);

    return {
      textContent: textContent.trim(),
      toolCalls,
      hasToolCalls: toolCalls.length > 0,
      errors
    };
  }

  /**
   * 提取所有 json:tool 代码块
   */
  private extractToolBlocks(response: string): ToolBlockMatch[] {
    const blocks: ToolBlockMatch[] = [];
    const regex = new RegExp(ToolParser.TOOL_BLOCK_REGEX.source, 'g');
    
    let match;
    while ((match = regex.exec(response)) !== null) {
      blocks.push({
        fullMatch: match[0],
        jsonContent: match[1].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return blocks;
  }

  /**
   * 解析单个工具块的 JSON 内容
   */
  private parseToolBlock(jsonContent: string): {
    success: boolean;
    toolCall?: ToolCall;
    error?: ParseError;
  } {
    // 尝试解析 JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e) {
      return {
        success: false,
        error: {
          type: 'malformed_json',
          message: `Invalid JSON: ${(e as Error).message}`
        }
      };
    }

    // 验证结构
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        success: false,
        error: {
          type: 'invalid_structure',
          message: 'Tool call must be an object'
        }
      };
    }

    const obj = parsed as Record<string, unknown>;

    // 检查必需字段
    if (!('tool' in obj) || typeof obj.tool !== 'string') {
      return {
        success: false,
        error: {
          type: 'missing_field',
          message: 'Missing required field: tool'
        }
      };
    }

    if (!('params' in obj) || typeof obj.params !== 'object' || obj.params === null) {
      return {
        success: false,
        error: {
          type: 'missing_field',
          message: 'Missing required field: params'
        }
      };
    }

    return {
      success: true,
      toolCall: {
        tool: obj.tool as string,
        params: obj.params as Record<string, unknown>
      }
    };
  }

  /**
   * 提取文本内容（移除工具块后的内容）
   */
  private extractTextContent(response: string, blocks: ToolBlockMatch[]): string {
    if (blocks.length === 0) {
      return response;
    }

    // 按位置排序
    const sortedBlocks = [...blocks].sort((a, b) => a.startIndex - b.startIndex);
    
    let result = '';
    let lastEnd = 0;

    for (const block of sortedBlocks) {
      // 添加块之前的文本
      result += response.substring(lastEnd, block.startIndex);
      lastEnd = block.endIndex;
    }

    // 添加最后一个块之后的文本
    result += response.substring(lastEnd);

    return result;
  }

  /**
   * 验证工具调用是否有效（用于外部验证）
   */
  isValidToolCall(toolCall: unknown): toolCall is ToolCall {
    if (typeof toolCall !== 'object' || toolCall === null) {
      return false;
    }

    const obj = toolCall as Record<string, unknown>;
    
    return (
      typeof obj.tool === 'string' &&
      obj.tool.length > 0 &&
      typeof obj.params === 'object' &&
      obj.params !== null
    );
  }
}
