/**
 * Axon Sensation - Insight Card UI Component
 * 展示文件分析结果的卡片组件
 */

import { FileAnalysisResult, HeadingInfo } from '../core/types';

export class InsightCard {
  private data: FileAnalysisResult;
  private container: HTMLElement | null = null;
  private headingsExpanded: boolean = true;

  constructor(data: FileAnalysisResult) {
    this.data = data;
  }

  /** 渲染卡片到容器 */
  render(container: HTMLElement): HTMLElement {
    this.container = container.createDiv({ cls: 'axon-insight-card' });
    
    this.renderHeader();
    this.renderStats();
    this.renderLinks();
    this.renderFrontmatter();
    this.renderHeadings();
    
    return this.container;
  }

  /** 渲染头部信息 */
  private renderHeader(): void {
    if (!this.container) return;

    const header = this.container.createDiv({ cls: 'axon-insight-header' });
    
    // 文件图标和名称
    const titleRow = header.createDiv({ cls: 'axon-insight-title-row' });
    titleRow.createSpan({ cls: 'axon-insight-icon', text: '📄' });
    titleRow.createSpan({ cls: 'axon-insight-filename', text: this.data.file.name });
    
    // 空文档标记
    if (this.data.isEmpty) {
      titleRow.createSpan({ cls: 'axon-insight-empty-badge', text: '空文档' });
    }
    
    // 文件路径
    header.createDiv({ 
      cls: 'axon-insight-path', 
      text: this.data.file.path 
    });
    
    // 最后修改时间
    header.createDiv({ 
      cls: 'axon-insight-modified', 
      text: `最后修改: ${this.data.stats.lastModified}` 
    });
  }


  /** 渲染统计信息 */
  private renderStats(): void {
    if (!this.container) return;

    const stats = this.container.createDiv({ cls: 'axon-insight-stats' });
    
    this.createStatItem(stats, '📝', '字数', this.data.stats.wordCount.toString());
    this.createStatItem(stats, '📏', '行数', this.data.stats.lineCount.toString());
    this.createStatItem(stats, '📑', '标题', this.data.structure.headingCount.toString());
    this.createStatItem(stats, '🔗', '链接', 
      (this.data.links.internalCount + this.data.links.externalCount).toString());
  }

  /** 创建统计项 */
  private createStatItem(container: HTMLElement, icon: string, label: string, value: string): void {
    const item = container.createDiv({ cls: 'axon-stat-item' });
    item.createSpan({ cls: 'axon-stat-icon', text: icon });
    item.createSpan({ cls: 'axon-stat-label', text: label });
    item.createSpan({ cls: 'axon-stat-value', text: value });
  }

  /** 渲染链接信息 */
  private renderLinks(): void {
    if (!this.container) return;
    if (this.data.links.internalCount === 0 && this.data.links.externalCount === 0) return;

    const linksSection = this.container.createDiv({ cls: 'axon-insight-links' });
    linksSection.createDiv({ cls: 'axon-insight-section-title', text: '🔗 链接详情' });
    
    const linksContent = linksSection.createDiv({ cls: 'axon-insight-links-content' });
    
    if (this.data.links.internalCount > 0) {
      const internalDiv = linksContent.createDiv({ cls: 'axon-link-group' });
      internalDiv.createSpan({ cls: 'axon-link-type', text: `内部链接 (${this.data.links.internalCount})` });
    }
    
    if (this.data.links.externalCount > 0) {
      const externalDiv = linksContent.createDiv({ cls: 'axon-link-group' });
      externalDiv.createSpan({ cls: 'axon-link-type', text: `外部链接 (${this.data.links.externalCount})` });
    }
  }

  /** 渲染 Frontmatter */
  private renderFrontmatter(): void {
    if (!this.container || !this.data.frontmatter) return;

    const fm = this.data.frontmatter;
    const fmSection = this.container.createDiv({ cls: 'axon-insight-frontmatter' });
    fmSection.createDiv({ cls: 'axon-insight-section-title', text: '📋 元数据' });
    
    const fmContent = fmSection.createDiv({ cls: 'axon-insight-fm-content' });
    
    if (fm.title) {
      this.createFmItem(fmContent, '标题', fm.title);
    }
    
    if (fm.date) {
      this.createFmItem(fmContent, '日期', fm.date);
    }
    
    if (fm.tags && fm.tags.length > 0) {
      const tagsDiv = fmContent.createDiv({ cls: 'axon-fm-item' });
      tagsDiv.createSpan({ cls: 'axon-fm-label', text: '标签: ' });
      const tagsContainer = tagsDiv.createSpan({ cls: 'axon-fm-tags' });
      fm.tags.forEach(tag => {
        tagsContainer.createSpan({ cls: 'axon-fm-tag', text: `#${tag}` });
      });
    }
  }

  /** 创建 Frontmatter 项 */
  private createFmItem(container: HTMLElement, label: string, value: string): void {
    const item = container.createDiv({ cls: 'axon-fm-item' });
    item.createSpan({ cls: 'axon-fm-label', text: `${label}: ` });
    item.createSpan({ cls: 'axon-fm-value', text: value });
  }

  /** 渲染标题结构 */
  private renderHeadings(): void {
    if (!this.container || this.data.structure.headings.length === 0) return;

    const headingsSection = this.container.createDiv({ cls: 'axon-insight-headings' });
    
    // 可折叠标题
    const titleRow = headingsSection.createDiv({ cls: 'axon-insight-section-title axon-collapsible' });
    const toggleIcon = titleRow.createSpan({ cls: 'axon-toggle-icon', text: this.headingsExpanded ? '▼' : '▶' });
    titleRow.createSpan({ text: ' 📑 文档结构' });
    
    const headingsContent = headingsSection.createDiv({ 
      cls: 'axon-insight-headings-content' + (this.headingsExpanded ? '' : ' axon-collapsed')
    });
    
    // 渲染标题树
    this.data.structure.headings.forEach(heading => {
      const headingItem = headingsContent.createDiv({ 
        cls: `axon-heading-item axon-heading-level-${heading.level}` 
      });
      headingItem.style.paddingLeft = `${(heading.level - 1) * 12}px`;
      headingItem.createSpan({ cls: 'axon-heading-marker', text: '#'.repeat(heading.level) + ' ' });
      headingItem.createSpan({ cls: 'axon-heading-text', text: heading.text });
    });
    
    // 点击切换展开/折叠
    titleRow.addEventListener('click', () => {
      this.headingsExpanded = !this.headingsExpanded;
      toggleIcon.textContent = this.headingsExpanded ? '▼' : '▶';
      headingsContent.toggleClass('axon-collapsed', !this.headingsExpanded);
    });
  }

  /** 获取数据 */
  getData(): FileAnalysisResult {
    return this.data;
  }
}
