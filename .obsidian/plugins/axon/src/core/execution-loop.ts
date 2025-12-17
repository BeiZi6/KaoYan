/**
 * Axon MCP - Execution Loop
 * 工具执行循环，协调 AI 响应解析和工具调用
 */

import { ToolManager, ToolCall, ToolResult } from './tool-manager';
import { ToolParser, ParsedResponse } from './tool-parser';
import { ChatMessage } from './types';

/** 执行上下文 */
export interface ExecutionContext {
  originalMessage: string;
  conversationHistory: ChatMessage[];
  maxIterations: number;
  fileContext?: string;
}

/** 工具执行记录 */
export interface ToolExecution {
  toolCall: ToolCall;
  result: ToolResult;
  timestamp: Date;
}

/** 循环执行结果 */
export interface LoopResult {
  finalResponse: string;
  toolExecutions: ToolExecution[];
  iterationCount: number;
  reachedMaxIterations: boolean;
}

/** 迭代回调 - 用于 UI 更新 */
export type IterationCallback = (execution: ToolExecution) => void;

/** AI 服务接口 - 用于依赖注入 */
export interface AIService {
  chatWithHistory(messages: ChatMessage[]): Promise<string>;
}

export class ExecutionLoop {
  private toolManager: ToolManager;
  private toolParser: ToolParser;
  private aiService: AIService;
  private onToolExecution?: IterationCallback;

  constructor(
    toolManager: ToolManager,
    toolParser: ToolParser,
    aiService: AIService
  ) {
    this.toolManager = toolManager;
    this.toolParser = toolParser;
    this.aiService = aiService;
  }

  /** 设置工具执行回调 */
  setOnToolExecution(callback: IterationCallback): void {
    this.onToolExecution = callback;
  }

  /** 执行完整的对话循环 */
  async run(context: ExecutionContext): Promise<LoopResult> {
    const { originalMessage, conversationHistory, maxIterations, fileContext } = context;
    const toolExecutions: ToolExecution[] = [];
    let iterationCount = 0;
    let reachedMaxIterations = false;

    // 构建初始消息
    const messages: ChatMessage[] = [...conversationHistory];
    
    // 添加用户消息（带上下文）
    let userContent = originalMessage;
    if (fileContext) {
      userContent = `Context from active note:\n\n${fileContext}\n\nUser Question: ${originalMessage}`;
    }
    messages.push({ role: 'user', content: userContent });

    let currentResponse = '';

    while (iterationCount < maxIterations) {
      iterationCount++;

      // 调用 AI
      const aiResponse = await this.aiService.chatWithHistory(messages);
      
      // 解析响应
      const parsed = this.toolParser.parse(aiResponse);

      // 如果没有工具调用，返回最终响应
      if (!parsed.hasToolCalls) {
        currentResponse = aiResponse;
        break;
      }

      // 保存文本内容
      if (parsed.textContent) {
        currentResponse = parsed.textContent;
      }

      // 执行所有工具调用
      const executionResults = await this.executeToolCalls(parsed.toolCalls);
      toolExecutions.push(...executionResults);

      // 将 AI 响应和工具结果添加到对话历史
      messages.push({ role: 'assistant', content: aiResponse });
      
      // 构建工具结果消息
      const toolResultsContent = this.formatToolResults(executionResults);
      messages.push({ role: 'user', content: toolResultsContent });

      // 检查是否达到最大迭代次数
      if (iterationCount >= maxIterations) {
        reachedMaxIterations = true;
        break;
      }
    }

    return {
      finalResponse: currentResponse,
      toolExecutions,
      iterationCount,
      reachedMaxIterations
    };
  }

  /** 执行单次迭代（用于测试） */
  async iterate(
    messages: ChatMessage[]
  ): Promise<{
    response: string;
    parsed: ParsedResponse;
    executions: ToolExecution[];
    shouldContinue: boolean;
  }> {
    const aiResponse = await this.aiService.chatWithHistory(messages);
    const parsed = this.toolParser.parse(aiResponse);

    if (!parsed.hasToolCalls) {
      return {
        response: aiResponse,
        parsed,
        executions: [],
        shouldContinue: false
      };
    }

    const executions = await this.executeToolCalls(parsed.toolCalls);

    return {
      response: aiResponse,
      parsed,
      executions,
      shouldContinue: true
    };
  }

  /** 执行工具调用列表 */
  private async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolExecution[]> {
    const executions: ToolExecution[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeSingleTool(toolCall);
      const execution: ToolExecution = {
        toolCall,
        result,
        timestamp: new Date()
      };
      executions.push(execution);

      // 触发回调
      if (this.onToolExecution) {
        this.onToolExecution(execution);
      }
    }

    return executions;
  }

  /** 执行单个工具调用 */
  private async executeSingleTool(toolCall: ToolCall): Promise<ToolResult> {
    // 检查工具是否存在
    const availableTools = this.toolManager.getToolDefinitions().map(t => t.name);
    if (!availableTools.includes(toolCall.tool)) {
      return {
        success: false,
        error: `Tool not found: ${toolCall.tool}. Available tools: ${availableTools.join(', ')}`
      };
    }

    // 执行工具
    return this.toolManager.execute(toolCall);
  }

  /** 格式化工具执行结果为消息内容 */
  private formatToolResults(executions: ToolExecution[]): string {
    const results = executions.map((exec, index) => {
      const status = exec.result.success ? '✅ Success' : '❌ Error';
      const content = exec.result.success 
        ? exec.result.data 
        : exec.result.error;
      
      return `Tool ${index + 1}: ${exec.toolCall.tool}\n${status}\n${content}`;
    });

    return `Tool execution results:\n\n${results.join('\n\n')}`;
  }
}
