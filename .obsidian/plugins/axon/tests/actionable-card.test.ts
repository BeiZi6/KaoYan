/**
 * Axon DeepSeek - Actionable Card Property Tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// 模拟 Markdown 渲染函数
function renderMarkdown(content: string): string {
  let html = content;
  
  // 代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` language-${lang}` : '';
    return `<pre class="axon-code-block${langClass}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="axon-inline-code">$1</code>');
  
  // 粗体
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 斜体
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 模拟渲染 Actionable Card
function renderActionableCard(content: string): string {
  const parts: string[] = [];
  
  parts.push('<div class="axon-actionable-card">');
  parts.push(`<div class="axon-ai-response-content">${renderMarkdown(content)}</div>`);
  parts.push('<div class="axon-action-buttons">');
  parts.push('<button class="axon-action-btn axon-action-append">📥 追加到笔记</button>');
  parts.push('<button class="axon-action-btn axon-action-save">📄 保存对话</button>');
  parts.push('</div>');
  parts.push('</div>');
  
  return parts.join('');
}

describe('ActionableCard', () => {
  /**
   * **Feature: axon-deepseek, Property 5: Actionable Card Rendering**
   * *For any* AI response content, the rendered card should contain
   * the response text and both action buttons.
   * **Validates: Requirements 3.1**
   */
  describe('Property 5: Actionable Card Rendering', () => {
    it('should contain response content and action buttons', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (content) => {
            const rendered = renderActionableCard(content);
            
            // 应该包含卡片容器
            expect(rendered).toContain('axon-actionable-card');
            
            // 应该包含响应内容区域
            expect(rendered).toContain('axon-ai-response-content');
            
            // 应该包含操作按钮区域
            expect(rendered).toContain('axon-action-buttons');
            
            // 应该包含追加按钮
            expect(rendered).toContain('追加到笔记');
            expect(rendered).toContain('axon-action-append');
            
            // 应该包含保存按钮
            expect(rendered).toContain('保存对话');
            expect(rendered).toContain('axon-action-save');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: axon-deepseek, Property 10: Markdown Rendering**
   * *For any* markdown content with formatting, the rendered HTML
   * should contain the appropriate HTML tags.
   * **Validates: Requirements 5.1, 5.2**
   */
  describe('Property 10: Markdown Rendering', () => {
    it('should render bold text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('*') && s.trim().length > 0),
          (text) => {
            const markdown = `**${text}**`;
            const html = renderMarkdown(markdown);
            expect(html).toContain('<strong>');
            expect(html).toContain('</strong>');
            expect(html).toContain(text);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render italic text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('*') && s.trim().length > 0),
          (text) => {
            const markdown = `*${text}*`;
            const html = renderMarkdown(markdown);
            expect(html).toContain('<em>');
            expect(html).toContain('</em>');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render inline code', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('`') && s.trim().length > 0),
          (code) => {
            const markdown = `\`${code}\``;
            const html = renderMarkdown(markdown);
            expect(html).toContain('axon-inline-code');
            expect(html).toContain(code);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render code blocks', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('`') && s.trim().length > 0),
          fc.constantFrom('', 'javascript', 'python', 'typescript'),
          (code, lang) => {
            const markdown = `\`\`\`${lang}\n${code}\n\`\`\``;
            const html = renderMarkdown(markdown);
            expect(html).toContain('axon-code-block');
            expect(html).toContain('<pre');
            expect(html).toContain('<code>');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Error Handling', () => {
  /**
   * **Feature: axon-deepseek, Property 9: Error Message User-Friendliness**
   * *For any* API error, the displayed error message should be user-friendly.
   * **Validates: Requirements 4.4**
   */
  describe('Property 9: Error Message User-Friendliness', () => {
    const friendlyErrors: Record<string, string> = {
      'net::ERR_NETWORK': '网络连接失败，请检查网络',
      '401': 'API Key 无效，请检查配置',
      '429': '请求过于频繁，请稍后重试',
      'unknown': 'AI 服务暂时不可用，请稍后重试'
    };

    function getFriendlyError(errorCode: string): string {
      for (const [key, message] of Object.entries(friendlyErrors)) {
        if (errorCode.includes(key)) {
          return message;
        }
      }
      return friendlyErrors['unknown'];
    }

    it('should return friendly messages for known errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('net::ERR_NETWORK', '401 Unauthorized', '429 Too Many Requests', 'Some random error'),
          (errorCode) => {
            const message = getFriendlyError(errorCode);
            
            // 消息不应该包含技术细节
            expect(message).not.toContain('ERR_');
            expect(message).not.toContain('Unauthorized');
            expect(message).not.toContain('Too Many');
            
            // 消息应该是中文
            expect(/[\u4e00-\u9fa5]/.test(message)).toBe(true);
            
            // 消息应该有合理长度
            expect(message.length).toBeGreaterThan(5);
            expect(message.length).toBeLessThan(50);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
