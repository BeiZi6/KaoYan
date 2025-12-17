/**
 * Axon - Settings Tab
 * 插件设置页面
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type AxonPlugin from '../main';

export class AxonSettingsTab extends PluginSettingTab {
  plugin: AxonPlugin;

  constructor(app: App, plugin: AxonPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Axon 设置' });

    // API Key 设置
    new Setting(containerEl)
      .setName('DeepSeek API Key')
      .setDesc('输入你的 DeepSeek API 密钥')
      .addText(text => {
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          });
        // 设置为密码类型以掩码显示
        text.inputEl.type = 'password';
        text.inputEl.addClass('axon-api-key-input');
      });

    // 显示/隐藏 API Key 按钮
    new Setting(containerEl)
      .setName('显示 API Key')
      .setDesc('切换 API Key 的可见性')
      .addToggle(toggle => {
        toggle
          .setValue(false)
          .onChange((value) => {
            const input = containerEl.querySelector('.axon-api-key-input') as HTMLInputElement;
            if (input) {
              input.type = value ? 'text' : 'password';
            }
          });
      });

    // Model Name 设置
    new Setting(containerEl)
      .setName('模型名称')
      .setDesc('DeepSeek 模型名称（默认: deepseek-chat）')
      .addText(text => text
        .setPlaceholder('deepseek-chat')
        .setValue(this.plugin.settings.modelName)
        .onChange(async (value) => {
          this.plugin.settings.modelName = value || 'deepseek-chat';
          await this.plugin.saveSettings();
        }));

    // 状态显示
    containerEl.createEl('h3', { text: '状态' });
    
    const statusEl = containerEl.createDiv({ cls: 'axon-settings-status' });
    
    if (this.plugin.settings.apiKey) {
      statusEl.createEl('p', { 
        text: '✅ API Key 已配置',
        cls: 'axon-status-ok'
      });
      statusEl.createEl('p', {
        text: `模型: ${this.plugin.settings.modelName}`,
        cls: 'axon-status-info'
      });
    } else {
      statusEl.createEl('p', { 
        text: '⚠️ 请配置 API Key 以启用 AI 功能',
        cls: 'axon-status-warning'
      });
    }

    // 使用说明
    containerEl.createEl('h3', { text: '使用说明' });
    const helpEl = containerEl.createDiv({ cls: 'axon-settings-help' });
    helpEl.createEl('p', { text: '1. 在 DeepSeek 官网获取 API Key' });
    helpEl.createEl('p', { text: '2. 将 API Key 粘贴到上方输入框' });
    helpEl.createEl('p', { text: '3. 打开 Axon 侧边栏开始对话' });
    
    const linkEl = helpEl.createEl('a', {
      text: '获取 DeepSeek API Key →',
      href: 'https://platform.deepseek.com/'
    });
    linkEl.setAttr('target', '_blank');
  }
}
