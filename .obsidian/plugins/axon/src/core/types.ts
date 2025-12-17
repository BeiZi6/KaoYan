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
