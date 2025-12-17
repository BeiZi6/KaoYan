/**
 * Axon Sensation - Core Type Definitions
 * 定义文件分析相关的所有接口和类型
 */

/** 标题信息 */
export interface HeadingInfo {
  level: number;      // 1-6
  text: string;
  position: number;   // line number
}

/** 链接信息 */
export interface LinkInfo {
  internal: string[];   // [[wiki links]]
  external: string[];   // https:// links
  internalCount: number;
  externalCount: number;
}

/** Frontmatter 元数据 */
export interface FrontmatterData {
  title?: string;
  tags?: string[];
  date?: string;
  [key: string]: unknown;
}

/** 文件分析结果 */
export interface FileAnalysisResult {
  file: {
    name: string;
    path: string;
    size: number;
  };
  stats: {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    lastModified: string;
  };
  structure: {
    headings: HeadingInfo[];
    headingCount: number;
  };
  links: LinkInfo;
  frontmatter: FrontmatterData | null;
  analyzedAt: Date;
  isEmpty: boolean;
}

/** 消息类型 */
export type MessageType = 'user' | 'assistant' | 'system' | 'error' | 'analysis';

/** 控制台消息 */
export interface ConsoleMessage {
  id?: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}

/** 事件总线回调类型 */
export type EventCallback<T = unknown> = (data: T) => void;

/** 文件变更事件数据 */
export interface FileChangeEventData {
  file: { name: string; path: string } | null;
  previousFile: { name: string; path: string } | null;
}

/** 分析事件数据 */
export interface AnalyzeEventData {
  result?: FileAnalysisResult;
  error?: string;
}

/** 插件设置 */
export interface AxonSettings {
  apiKey: string;
  modelName: string;
}

export const DEFAULT_SETTINGS: AxonSettings = {
  apiKey: '',
  modelName: 'deepseek-chat'
};

/** DeepSeek API 消息 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** DeepSeek API 请求 */
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
}

/** DeepSeek API 响应 */
export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** 上下文模式 */
export type ContextMode = 'selection' | 'fullNote' | 'noFile';

/** 选区状态 */
export interface SelectionState {
  mode: ContextMode;
  selectedText: string | null;
  originalSelection: string | null;
  timestamp: number;
}

/** 对话数据 */
export interface ConversationData {
  userMessage: string;
  aiResponse: string;
  context?: string;
  timestamp: Date;
  contextMode: ContextMode;
  originalSelection?: string;
}
