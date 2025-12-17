/**
 * Axon MCP - Tool Manager
 * 工具管理器，封装所有可供 AI 调用的 Obsidian API 操作
 */

import { App, TFile, TFolder, TAbstractFile } from 'obsidian';

/** 工具定义 - 用于 System Prompt */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

/** 工具执行结果 */
export interface ToolResult {
  success: boolean;
  data?: string;
  error?: string;
}

/** 工具调用请求 */
export interface ToolCall {
  tool: string;
  params: Record<string, unknown>;
}

/** 文件夹列表项 */
export interface FolderItem {
  name: string;
  type: 'file' | 'folder';
}

/** 非法路径字符 */
const INVALID_PATH_CHARS = /[<>:"|?*]/;

export class ToolManager {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /** 获取所有工具定义（用于 System Prompt） */
  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'read_note',
        description: '读取指定路径的 Markdown 笔记内容。路径相对于 Vault 根目录。',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '笔记文件路径，例如 "Daily/2025-01-15.md" 或 "Ideas/project"（会自动添加 .md 扩展名）'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'create_note',
        description: '在指定路径创建或更新笔记。如果父文件夹不存在会自动创建。',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '笔记文件路径，例如 "Diary/2025-Plan.md"'
            },
            content: {
              type: 'string',
              description: '笔记内容（Markdown 格式）'
            },
            mode: {
              type: 'string',
              description: '写入模式：overwrite（覆盖，默认）或 append（追加）',
              enum: ['overwrite', 'append']
            }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'list_folder',
        description: '列出指定文件夹下的所有文件和子文件夹。',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '文件夹路径，空字符串或 "/" 表示根目录'
            }
          },
          required: ['path']
        }
      }
    ];
  }

  /** 执行工具调用 */
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    // 参数验证
    const validationError = this.validateParams(toolCall);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const { tool, params } = toolCall;

    switch (tool) {
      case 'read_note':
        return this.readNote(params.path as string);
      case 'create_note':
        return this.createNote(
          params.path as string,
          params.content as string,
          (params.mode as 'overwrite' | 'append') || 'overwrite'
        );
      case 'list_folder':
        return this.listFolder(params.path as string);
      default:
        return { success: false, error: `Tool not found: ${tool}` };
    }
  }

  /** 验证工具调用参数 */
  validateParams(toolCall: ToolCall): string | null {
    const { tool, params } = toolCall;
    const definitions = this.getToolDefinitions();
    const def = definitions.find(d => d.name === tool);

    if (!def) {
      return `Unknown tool: ${tool}`;
    }

    // 检查必需参数
    for (const required of def.parameters.required) {
      if (!(required in params) || params[required] === undefined || params[required] === null) {
        return `Missing required parameter: ${required}`;
      }
    }

    // 检查参数类型
    for (const [key, value] of Object.entries(params)) {
      const propDef = def.parameters.properties[key];
      if (!propDef) continue;

      if (propDef.type === 'string' && typeof value !== 'string') {
        return `Parameter '${key}' must be a string`;
      }

      // 检查枚举值
      if (propDef.enum && !propDef.enum.includes(value as string)) {
        return `Parameter '${key}' must be one of: ${propDef.enum.join(', ')}`;
      }
    }

    return null;
  }

  /** 规范化路径 - 自动添加 .md 扩展名 */
  normalizePath(path: string): string {
    if (!path || path.trim().length === 0) {
      return '';
    }

    let normalized = path.trim();
    
    // 移除开头的斜杠
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1);
    }

    // 如果没有 .md 扩展名，添加它
    if (!normalized.toLowerCase().endsWith('.md')) {
      normalized = normalized + '.md';
    }

    return normalized;
  }

  /** 验证路径是否包含非法字符 */
  isValidPath(path: string): boolean {
    return !INVALID_PATH_CHARS.test(path);
  }

  /** 读取笔记内容 */
  private async readNote(path: string): Promise<ToolResult> {
    const normalizedPath = this.normalizePath(path);
    
    if (!normalizedPath) {
      return { success: false, error: 'Path cannot be empty' };
    }

    const file = this.app.vault.getAbstractFileByPath(normalizedPath);

    if (!file) {
      return { success: false, error: `File not found: ${normalizedPath}` };
    }

    if (!(file instanceof TFile)) {
      return { success: false, error: `Path is not a file: ${normalizedPath}` };
    }

    try {
      const content = await this.app.vault.read(file);
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: `Failed to read file: ${(error as Error).message}` };
    }
  }

  /** 创建或更新笔记 */
  private async createNote(
    path: string,
    content: string,
    mode: 'overwrite' | 'append' = 'overwrite'
  ): Promise<ToolResult> {
    const normalizedPath = this.normalizePath(path);

    if (!normalizedPath) {
      return { success: false, error: 'Path cannot be empty' };
    }

    if (!this.isValidPath(normalizedPath)) {
      return { success: false, error: `Invalid path: contains illegal characters (<>:"|?*)` };
    }

    try {
      // 确保父文件夹存在
      const folderPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
      if (folderPath) {
        await this.ensureFolderExists(folderPath);
      }

      const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath);

      if (existingFile && existingFile instanceof TFile) {
        // 文件已存在
        if (mode === 'append') {
          const currentContent = await this.app.vault.read(existingFile);
          const newContent = currentContent + '\n' + content;
          await this.app.vault.modify(existingFile, newContent);
          return { success: true, data: `Content appended to: ${normalizedPath}` };
        } else {
          // overwrite
          await this.app.vault.modify(existingFile, content);
          return { success: true, data: `File overwritten: ${normalizedPath}` };
        }
      } else {
        // 创建新文件
        await this.app.vault.create(normalizedPath, content);
        return { success: true, data: `File created: ${normalizedPath}` };
      }
    } catch (error) {
      return { success: false, error: `Failed to write file: ${(error as Error).message}` };
    }
  }

  /** 确保文件夹存在，如果不存在则创建 */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  /** 列出文件夹内容 */
  private async listFolder(path: string): Promise<ToolResult> {
    let normalizedPath = path.trim();
    
    // 处理根目录
    if (normalizedPath === '/' || normalizedPath === '') {
      normalizedPath = '';
    } else if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.slice(1);
    }

    // 移除末尾斜杠
    if (normalizedPath.endsWith('/')) {
      normalizedPath = normalizedPath.slice(0, -1);
    }

    const items: FolderItem[] = [];

    if (normalizedPath === '') {
      // 根目录
      const rootFiles = this.app.vault.getRoot().children;
      for (const file of rootFiles) {
        items.push({
          name: file.name,
          type: file instanceof TFolder ? 'folder' : 'file'
        });
      }
    } else {
      const folder = this.app.vault.getAbstractFileByPath(normalizedPath);
      
      if (!folder) {
        return { success: false, error: `Folder not found: ${normalizedPath}` };
      }

      if (!(folder instanceof TFolder)) {
        return { success: false, error: `Path is not a folder: ${normalizedPath}` };
      }

      for (const file of folder.children) {
        items.push({
          name: file.name,
          type: file instanceof TFolder ? 'folder' : 'file'
        });
      }
    }

    // 格式化输出
    const output = items
      .map(item => `${item.type === 'folder' ? '📁' : '📄'} ${item.name}`)
      .join('\n');

    return { 
      success: true, 
      data: items.length > 0 ? output : '(empty folder)' 
    };
  }
}
