# Requirements Document

## Introduction

本文档定义了 Axon 插件第二阶段"触觉 (Sensation)"功能的需求。该阶段的目标是让 Axon 能够读取、分析并理解当前激活的 Markdown 笔记内容，为后续的智能交互奠定基础。

## Glossary

- **Axon**: Obsidian 侧边栏 AI Agent 插件
- **Markdown_Note**: Obsidian 中的 Markdown 格式笔记文件
- **Active_File**: 当前在编辑器中打开并处于焦点状态的文件
- **File_Analysis**: 对文件内容进行结构化分析的过程
- **Insight_Card**: 在控制台中显示文件分析结果的 UI 组件
- **Frontmatter**: Markdown 文件顶部的 YAML 元数据块
- **Heading_Structure**: 文档中标题的层级结构
- **Word_Count**: 文档中的字数统计
- **Link_Analysis**: 对文档中内部链接和外部链接的分析

## Requirements

### Requirement 1

**User Story:** As a user, I want Axon to detect and read the currently active Markdown note, so that I can get insights about my current document.

#### Acceptance Criteria

1. WHEN a user clicks the "Analyze" button THEN the Axon_System SHALL retrieve the content of the Active_File
2. WHEN no file is currently active THEN the Axon_System SHALL display a clear error message indicating no file is open
3. WHEN the active file is not a Markdown file THEN the Axon_System SHALL display a message indicating only Markdown files are supported
4. WHEN the Axon_System retrieves file content THEN the Axon_System SHALL access the file within 500 milliseconds

### Requirement 2

**User Story:** As a user, I want Axon to analyze the structure of my Markdown note, so that I can understand the organization of my document.

#### Acceptance Criteria

1. WHEN the Axon_System analyzes a Markdown_Note THEN the Axon_System SHALL extract all headings with their hierarchy levels (H1-H6)
2. WHEN the Axon_System analyzes a Markdown_Note THEN the Axon_System SHALL calculate the total Word_Count of the document
3. WHEN the Axon_System analyzes a Markdown_Note THEN the Axon_System SHALL identify and count all internal links (wiki-style [[links]])
4. WHEN the Axon_System analyzes a Markdown_Note THEN the Axon_System SHALL identify and count all external links (URL format)
5. WHEN the Axon_System analyzes a Markdown_Note THEN the Axon_System SHALL extract Frontmatter metadata if present

### Requirement 3

**User Story:** As a user, I want to see the analysis results in a clear visual format, so that I can quickly understand my document's characteristics.

#### Acceptance Criteria

1. WHEN File_Analysis completes THEN the Axon_System SHALL display an Insight_Card in the console output
2. WHEN displaying an Insight_Card THEN the Axon_System SHALL show the file name, Word_Count, heading count, and link counts
3. WHEN displaying an Insight_Card THEN the Axon_System SHALL format the information using clear visual hierarchy
4. WHEN the Insight_Card contains Frontmatter data THEN the Axon_System SHALL display key metadata fields (tags, date, title)
5. WHEN displaying heading structure THEN the Axon_System SHALL show headings in a collapsible tree format

### Requirement 4

**User Story:** As a user, I want Axon to automatically detect when I switch to a different note, so that the analysis stays relevant to my current context.

#### Acceptance Criteria

1. WHEN the user switches to a different Active_File THEN the Axon_System SHALL detect the file change event
2. WHEN a file change is detected THEN the Axon_System SHALL update the internal context reference
3. WHEN the Axon_System detects a file change THEN the Axon_System SHALL display a brief notification in the console

### Requirement 5

**User Story:** As a user, I want the analysis to handle edge cases gracefully, so that the plugin remains stable with any document.

#### Acceptance Criteria

1. WHEN the Active_File content is empty THEN the Axon_System SHALL display an Insight_Card with zero counts and an "empty document" indicator
2. WHEN the Active_File contains malformed Frontmatter THEN the Axon_System SHALL skip Frontmatter parsing and continue with content analysis
3. WHEN the Active_File is very large (over 100KB) THEN the Axon_System SHALL complete analysis within 2 seconds
4. WHEN analysis encounters an unexpected error THEN the Axon_System SHALL display a user-friendly error message and log details to console
