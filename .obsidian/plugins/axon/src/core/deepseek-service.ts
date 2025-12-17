/**
 * Axon - DeepSeek Service
 * AI API 服务封装
 */

import { App, requestUrl } from 'obsidian';
import { AxonSettings, ChatMessage, ChatRequest, DeepSeekResponse } from './types';
import { ToolDefinition } from './tool-manager';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `你是一个集成在 Obsidian 中的智能助手 Axon。你可以读取用户的笔记。请用简洁、专业的 Markdown 格式回答。`;

export class DeepSeekService {
  private app: App;
  private getSettings: () => AxonSettings;

  constructor(app: App, getSettings: () => AxonSettings) {
    this.app = app;
    this.getSettings = getSettings;
  }

  /** 构建 Agent Mode 的 System Prompt（包含工具定义） */
  buildAgentSystemPrompt(toolDefinitions: ToolDefinition[]): string {
    const toolSchemas = toolDefinitions.map(tool => {
      return `### ${tool.name}
${tool.description}

Parameters:
\`\`\`json
${JSON.stringify(tool.parameters, null, 2)}
\`\`\``;
    }).join('\n\n');

    return `你是 Axon，一个集成在 Obsidian 中的智能助手。你拥有 Agent Mode 权限，可以读取、创建和管理用户 Vault 中的任何笔记。

## 可用工具

${toolSchemas}

## 工具使用规则

1. 当你需要执行文件操作时，使用 \`\`\`json:tool 代码块输出工具调用
2. 工具调用格式必须严格遵循以下 JSON 结构：

\`\`\`json:tool
{
  "tool": "工具名称",
  "params": {
    "参数名": "参数值"
  }
}
\`\`\`

3. 你可以在一次回复中调用多个工具，每个工具使用单独的 \`\`\`json:tool 代码块
4. 工具执行结果会自动返回给你，你可以根据结果继续对话
5. 如果不需要执行工具操作，直接用普通文本回复用户

## 示例

用户: "在 Diary 文件夹下创建一个 2025-Plan.md 文件"

你的回复:
好的，我来为你创建这个文件。

\`\`\`json:tool
{
  "tool": "create_note",
  "params": {
    "path": "Diary/2025-Plan.md",
    "content": "# 2025 年计划\\n\\n## 目标\\n\\n- [ ] 目标1\\n- [ ] 目标2\\n\\n## 行动计划\\n\\n待补充..."
  }
}
\`\`\`

## 注意事项

- 路径相对于 Vault 根目录
- 文件路径会自动添加 .md 扩展名
- 创建文件时会自动创建不存在的父文件夹
- 请用简洁、专业的 Markdown 格式回答用户问题`;
  }

  /** 检查是否已配置 API Key */
  isConfigured(): boolean {
    const settings = this.getSettings();
    return !!settings.apiKey && settings.apiKey.trim().length > 0;
  }

  /** 构建带上下文的用户消息 (全文模式) */
  buildUserMessage(userQuestion: string, fileContext?: string): string {
    if (fileContext && fileContext.trim().length > 0) {
      return `Context from active note:\n\n${fileContext}\n\nUser Question: ${userQuestion}`;
    }
    return userQuestion;
  }

  /** 构建选区模式的用户消息 */
  buildSelectionMessage(userInstruction: string, selectedText: string): string {
    return `Selected Text:\n\n${selectedText}\n\nUser Instruction: ${userInstruction}`;
  }

  /** 构建请求消息数组 */
  buildMessages(userMessage: string, fileContext?: string): ChatMessage[] {
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: this.buildUserMessage(userMessage, fileContext) }
    ];
  }

  /** 发送聊天请求 */
  async chat(userMessage: string, fileContext?: string): Promise<string> {
    const settings = this.getSettings();
    
    if (!this.isConfigured()) {
      throw new Error('请先在设置中配置 DeepSeek API Key');
    }

    const messages = this.buildMessages(userMessage, fileContext);
    
    const requestBody: ChatRequest = {
      model: settings.modelName || 'deepseek-chat',
      messages: messages,
      stream: false
    };

    try {
      const response = await requestUrl({
        url: DEEPSEEK_API_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status !== 200) {
        console.error('DeepSeek API error:', response);
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = response.json as DeepSeekResponse;
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('AI 未返回有效响应');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek service error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API Key')) {
          throw error;
        }
        if (error.message.includes('net::')) {
          throw new Error('网络连接失败，请检查网络');
        }
        if (error.message.includes('401')) {
          throw new Error('API Key 无效，请检查配置');
        }
        if (error.message.includes('429')) {
          throw new Error('请求过于频繁，请稍后重试');
        }
      }
      
      throw new Error('AI 服务暂时不可用，请稍后重试');
    }
  }

  /** 支持多轮对话的聊天方法（用于 Agent Mode） */
  async chatWithHistory(messages: ChatMessage[]): Promise<string> {
    const settings = this.getSettings();
    
    if (!this.isConfigured()) {
      throw new Error('请先在设置中配置 DeepSeek API Key');
    }

    const requestBody: ChatRequest = {
      model: settings.modelName || 'deepseek-chat',
      messages: messages,
      stream: false
    };

    try {
      const response = await requestUrl({
        url: DEEPSEEK_API_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status !== 200) {
        console.error('DeepSeek API error:', response);
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = response.json as DeepSeekResponse;
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('AI 未返回有效响应');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek service error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API Key')) {
          throw error;
        }
        if (error.message.includes('net::')) {
          throw new Error('网络连接失败，请检查网络');
        }
        if (error.message.includes('401')) {
          throw new Error('API Key 无效，请检查配置');
        }
        if (error.message.includes('429')) {
          throw new Error('请求过于频繁，请稍后重试');
        }
      }
      
      throw new Error('AI 服务暂时不可用，请稍后重试');
    }
  }
}
