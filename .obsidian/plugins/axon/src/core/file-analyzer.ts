/**
 * Axon Sensation - File Analyzer Module
 * 负责分析 Markdown 文件内容
 */

import { App, TFile, MarkdownView, CachedMetadata } from 'obsidian';
import { FileAnalysisResult, HeadingInfo, LinkInfo, FrontmatterData } from './types';

export class FileAnalyzer {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * 分析当前活动文件
   */
  async analyzeCurrentFile(): Promise<FileAnalysisResult | null> {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    
    if (!activeView || !activeView.file) {
      return null;
    }

    return this.analyzeFile(activeView.file);
  }

  /**
   * 分析指定文件
   */
  async analyzeFile(file: TFile): Promise<FileAnalysisResult> {
    const content = await this.app.vault.read(file);
    const cache = this.app.metadataCache.getFileCache(file);
    
    const headings = this.extractHeadings(content);
    const wordCount = this.countWords(content);
    const links = this.extractLinks(content, cache);
    const frontmatter = this.parseFrontmatter(cache);
    const isEmpty = content.trim().length === 0;

    const lastModified = new Date(file.stat.mtime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      file: {
        name: file.name,
        path: file.path,
        size: file.stat.size
      },
      stats: {
        wordCount,
        characterCount: content.length,
        lineCount: content.split('\n').length,
        lastModified
      },
      structure: {
        headings,
        headingCount: headings.length
      },
      links,
      frontmatter,
      analyzedAt: new Date(),
      isEmpty
    };
  }


  /**
   * 提取标题信息
   * Property 2: Heading Extraction Accuracy
   */
  extractHeadings(content: string): HeadingInfo[] {
    const headings: HeadingInfo[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          position: i + 1
        });
      }
    }
    
    return headings;
  }

  /**
   * 统计字数
   * Property 3: Word Count Consistency
   */
  countWords(content: string): number {
    // 移除 frontmatter
    const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
    
    // 移除 markdown 语法标记
    const cleanContent = contentWithoutFrontmatter
      .replace(/```[\s\S]*?```/g, '')  // 代码块
      .replace(/`[^`]+`/g, '')          // 行内代码
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // 链接文本
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')   // 图片
      .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')  // wiki链接
      .replace(/[#*_~>`]/g, '')         // 格式标记
      .replace(/\n+/g, ' ')             // 换行转空格
      .trim();
    
    if (!cleanContent) return 0;
    
    // 分割并过滤空字符串
    const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * 提取链接
   * Property 4: Link Extraction Completeness
   */
  extractLinks(content: string, cache: CachedMetadata | null): LinkInfo {
    const internal: string[] = [];
    const external: string[] = [];
    
    // 提取 wiki 链接 [[link]]
    const wikiLinkRegex = /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g;
    let match;
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      internal.push(match[1]);
    }
    
    // 提取外部链接
    const urlRegex = /https?:\/\/[^\s\)>\]]+/g;
    while ((match = urlRegex.exec(content)) !== null) {
      external.push(match[0]);
    }
    
    return {
      internal,
      external,
      internalCount: internal.length,
      externalCount: external.length
    };
  }

  /**
   * 解析 Frontmatter
   * Property 5: Frontmatter Parsing Round-Trip
   */
  parseFrontmatter(cache: CachedMetadata | null): FrontmatterData | null {
    if (!cache || !cache.frontmatter) {
      return null;
    }
    
    try {
      const { position, ...frontmatterData } = cache.frontmatter;
      return frontmatterData as FrontmatterData;
    } catch (error) {
      console.warn('Failed to parse frontmatter:', error);
      return null;
    }
  }

  /**
   * 检查文件是否为 Markdown
   */
  isMarkdownFile(file: TFile): boolean {
    return file.extension === 'md';
  }
}
