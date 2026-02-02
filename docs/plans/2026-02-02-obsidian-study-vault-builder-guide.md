# Obsidian Study Vault Builder 实用指南（进阶版）

适用人群：已经熟悉 Obsidian，想把课程资料系统化为“可复习、可测试、可扩展”的学习库。

核心目标：
- 结构稳定（章节与文件一致）
- 内容完整（覆盖所有课件主题）
- 渲染正确（移动端可用、无插件依赖）
- 复习高效（速查 + 练习题驱动）

---

## 一、最小可扩展目录结构

```
course-name/
├── 00-overview/
├── 01-chapter-name/
│   ├── core-concepts.md
│   ├── quick-ref.md
│   └── practice-problems.md
├── cross-chapter/
└── mock-exams/
```

每章固定 3 个文件：
- `core-concepts.md`：主线知识
- `quick-ref.md`：速查复习
- `practice-problems.md`：练习题 + 折叠解答

---

## 二、核心模板（可直接复用）

### 1) core-concepts.md 顶部模板

```markdown
# Chapter X: 名称
[[../00-overview/course-map|← Back to Course Map]] | [[quick-ref|Quick Reference →]]
---
## Learning Objectives (COX)
> [!note] Course Outcome COX
> 简要描述
>
> By the end of this chapter, you should be able to:
> - 目标 1
> - 目标 2
---
## Table of Contents
```

### 2) practice-problems.md 折叠解答模板

```markdown
### Problem 1: 标题
**Question:** 题干

> [!example]- Solution
>
> **Approach:** 思路
>
> **Steps:** 分步
>
> **Complexity:** 分析
```

---

## 三、检查点式流程（避免返工）

1. **先做第 1 章**：完整落地结构、模板、链接与题目风格。  
2. **停下确认**：结构、导航、渲染、练习题是否符合预期。  
3. **批量推进**：其余章节沿用同一模式。  
4. **全局 QA**：统一排查渲染、链接、覆盖率问题。  

这个流程能把“结构问题”限制在第一章，避免后期大规模返修。

---

## 四、常见错误模式与快速修复

### Mermaid 特殊字符导致渲染失败
- 问题：`≤ ≥ ∞ →` 等符号
- 修复：替换为 ASCII（`<=`, `>=`, `infinity`, `->`）

### 表格里的 LaTeX 竖线破坏表格
- 问题：`|V|`、`|E|`
- 修复：转义为 `\|V\|`、`\|E\|`

### 折叠解答不生效
- 问题：使用了 HTML `<details>` 标签
- 修复：改用 `> [!example]- Solution` callout

### 内部链接失效
- 问题：使用 Markdown 锚点 `[Text](#section)`
- 修复：使用 Obsidian wiki-link `[[#Section Name]]` 或 `[[file#Section Name]]`

建议做法：**批量搜索 → 统一修复**，不要只修一个实例。

---

## 五、质量保证（精简版清单）

**结构一致性**
- 每章 3 文件齐全
- 导航可回 `course-map`
- 路径与命名统一

**内容完整性**
- 课件主题无遗漏
- 关键概念有例子
- 练习题覆盖应用型理解

**格式正确性**
- Mermaid 可渲染
- LaTeX 不破表格
- 折叠解答可展开
- 内部链接可跳转

**移动端友好**
- 仅使用原生功能
- 不依赖插件与自定义 CSS

---

## 六、实战建议（面向熟练用户）

- 先把模板固定，再做内容扩展
- 练习题每章 10 道足够，重质量不重数量
- quick-ref 以“一页可扫”为标准
- 任何渲染错误都按“模式”修复，不做零散修补

---

## 七、下一步可选动作

如果你愿意，我可以：
- 用你的真实课程资料生成第 1 章样板（核心概念 + 速查 + 练习题）
- 在现有仓库中执行一次全局 QA（修 Mermaid、表格、链接）
- 产出 mock-exams 与 cross-chapter 对比整理

