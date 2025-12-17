# Requirements Document

## Introduction

本文档定义了 Axon 插件第三阶段"激活大脑皮层"功能的需求。该阶段的目标是将 Axon 升级为真正的 AI Agent，通过集成 DeepSeek API 实现智能对话，并赋予 Axon 修改文件的能力。

## Glossary

- **Axon**: Obsidian 侧边栏 AI Agent 插件
- **DeepSeek_API**: DeepSeek 提供的大语言模型 API 服务
- **API_Key**: 用于认证 DeepSeek API 的密钥
- **Settings_Tab**: Obsidian 插件设置页面
- **Actionable_Card**: 包含可执行操作按钮的 AI 响应卡片
- **Context_Injection**: 将当前笔记内容作为上下文注入 AI 请求
- **requestUrl**: Obsidian 提供的 HTTP 请求 API

## Requirements

### Requirement 1

**User Story:** As a user, I want to configure my DeepSeek API credentials in a settings panel, so that Axon can connect to the AI service.

#### Acceptance Criteria

1. WHEN the user opens plugin settings THEN the Axon_System SHALL display a dedicated settings tab with API configuration options
2. WHEN displaying the API Key input THEN the Axon_System SHALL mask the key value using asterisks for privacy protection
3. WHEN the user saves settings THEN the Axon_System SHALL persist the API Key and Model Name to plugin data storage
4. WHEN settings are loaded THEN the Axon_System SHALL restore previously saved API Key and Model Name values
5. THE Axon_System SHALL provide a default Model Name value of "deepseek-chat"

### Requirement 2

**User Story:** As a user, I want Axon to send my messages to DeepSeek API with context from my current note, so that I can get intelligent responses based on my content.

#### Acceptance Criteria

1. WHEN the user sends a message THEN the Axon_System SHALL construct a request to https://api.deepseek.com/chat/completions
2. WHEN constructing the request THEN the Axon_System SHALL include a system prompt identifying Axon as an Obsidian assistant
3. WHEN a Markdown file is currently open THEN the Axon_System SHALL include the file content as context in the user message
4. WHEN sending the API request THEN the Axon_System SHALL use Obsidian requestUrl API to avoid CORS issues
5. WHEN the API returns a response THEN the Axon_System SHALL display the AI response in the console output
6. IF the API Key is not configured THEN the Axon_System SHALL display an error message prompting configuration

### Requirement 3

**User Story:** As a user, I want action buttons on AI responses, so that I can easily save or append the content to my notes.

#### Acceptance Criteria

1. WHEN displaying an AI response THEN the Axon_System SHALL render an Actionable_Card with action buttons
2. WHEN the user clicks "Append" button THEN the Axon_System SHALL append the AI response to the currently open note
3. WHEN the user clicks "Save Note" button THEN the Axon_System SHALL create a new file named "Axon-Chat-[timestamp].md" with the conversation
4. WHEN no file is currently open for append action THEN the Axon_System SHALL display an error message
5. WHEN file operation completes successfully THEN the Axon_System SHALL display a success notification

### Requirement 4

**User Story:** As a user, I want visual feedback during API requests, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHEN an API request is in progress THEN the Axon_System SHALL disable the input textarea and buttons
2. WHEN an API request is in progress THEN the Axon_System SHALL display a loading indicator on the send button
3. WHEN the API request completes THEN the Axon_System SHALL re-enable the input controls
4. WHEN an API error occurs THEN the Axon_System SHALL display a user-friendly error message

### Requirement 5

**User Story:** As a user, I want the AI responses to be formatted properly, so that I can read them easily.

#### Acceptance Criteria

1. WHEN displaying AI response THEN the Axon_System SHALL render Markdown formatting (bold, italic, code, lists)
2. WHEN displaying code blocks THEN the Axon_System SHALL apply syntax highlighting styles
3. WHEN the response is long THEN the Axon_System SHALL ensure proper scrolling behavior
