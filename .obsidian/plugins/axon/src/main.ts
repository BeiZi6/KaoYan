/**
 * Axon - Main Plugin Entry
 * Obsidian 插件主入口
 */

import { Plugin } from 'obsidian';
import { AxonView, AXON_VIEW_TYPE } from './core/axon-view';
import { AxonSettingsTab } from './core/settings-tab';
import { AxonSettings, DEFAULT_SETTINGS } from './core/types';

export default class AxonPlugin extends Plugin {
  settings: AxonSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    console.log('Loading Axon plugin...');

    // 加载设置
    await this.loadSettings();

    // 注册视图
    this.registerView(
      AXON_VIEW_TYPE,
      (leaf) => new AxonView(leaf, this)
    );

    // 添加设置页
    this.addSettingTab(new AxonSettingsTab(this.app, this));

    // 添加侧边栏图标
    this.addRibbonIcon('terminal-square', 'Axon Console', () => {
      this.activateView();
    });

    // 添加命令
    this.addCommand({
      id: 'open-axon-console',
      name: '打开 Axon 控制台',
      callback: () => {
        this.activateView();
      }
    });

    this.addCommand({
      id: 'analyze-current-file',
      name: '分析当前文件',
      callback: async () => {
        await this.activateView();
      }
    });

    console.log('Axon plugin loaded successfully');
  }

  onunload(): void {
    console.log('Unloading Axon plugin...');
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;

    let leaf = null;
    const leaves = workspace.getLeavesOfType(AXON_VIEW_TYPE);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: AXON_VIEW_TYPE,
          active: true
        });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}
