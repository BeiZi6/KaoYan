/**
 * Mock Obsidian module for testing
 */

export class App {
  vault = new Vault();
  workspace = new Workspace();
  setting = { open: () => {}, openTabById: () => {} };
}

export class Vault {
  private files: Map<string, TFile> = new Map();
  private folders: Map<string, TFolder> = new Map();
  private fileContents: Map<string, string> = new Map();
  private rootFolder: TFolder;

  constructor() {
    this.rootFolder = new TFolder('', null);
  }

  getAbstractFileByPath(path: string): TAbstractFile | null {
    return this.files.get(path) || this.folders.get(path) || null;
  }

  getRoot(): TFolder {
    return this.rootFolder;
  }

  async read(file: TFile): Promise<string> {
    return this.fileContents.get(file.path) || '';
  }

  async create(path: string, content: string): Promise<TFile> {
    const file = new TFile(path, null);
    this.files.set(path, file);
    this.fileContents.set(path, content);
    return file;
  }

  async modify(file: TFile, content: string): Promise<void> {
    this.fileContents.set(file.path, content);
  }

  async createFolder(path: string): Promise<void> {
    const folder = new TFolder(path, null);
    this.folders.set(path, folder);
  }

  getActiveFile(): TFile | null {
    return null;
  }

  // Test helpers
  _addFile(path: string, content: string): void {
    const file = new TFile(path, null);
    this.files.set(path, file);
    this.fileContents.set(path, content);
  }

  _addFolder(path: string, children: TAbstractFile[] = []): void {
    const folder = new TFolder(path, null);
    folder.children = children;
    this.folders.set(path, folder);
  }

  _setRootChildren(children: TAbstractFile[]): void {
    this.rootFolder.children = children;
  }

  _clear(): void {
    this.files.clear();
    this.folders.clear();
    this.fileContents.clear();
    this.rootFolder.children = [];
  }
}

export class Workspace {
  private activeFile: TFile | null = null;
  private activeView: MarkdownView | null = null;

  getActiveFile(): TFile | null {
    return this.activeFile;
  }

  getActiveViewOfType<T>(type: any): T | null {
    return this.activeView as any;
  }

  getLeavesOfType(type: string): WorkspaceLeaf[] {
    return [];
  }

  getRightLeaf(split: boolean): WorkspaceLeaf | null {
    return new WorkspaceLeaf();
  }

  revealLeaf(leaf: WorkspaceLeaf): void {}
}

export class WorkspaceLeaf {
  async setViewState(state: any): Promise<void> {}
}

export abstract class TAbstractFile {
  name: string;
  path: string;
  parent: TFolder | null;

  constructor(path: string, parent: TFolder | null) {
    this.path = path;
    this.name = path.split('/').pop() || path;
    this.parent = parent;
  }
}

export class TFile extends TAbstractFile {
  extension: string;
  stat = { mtime: Date.now(), ctime: Date.now(), size: 0 };
  basename: string;

  constructor(path: string, parent: TFolder | null = null) {
    super(path, parent);
    this.extension = path.split('.').pop() || '';
    this.basename = this.name.replace(/\.[^.]+$/, '');
  }
}

export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];

  constructor(path: string, parent: TFolder | null) {
    super(path, parent);
  }
}

export class MarkdownView {
  file: TFile | null = null;
  editor: Editor | null = null;

  getViewType(): string {
    return 'markdown';
  }
}

export class Editor {
  private content: string = '';
  private selection: string = '';

  getSelection(): string {
    return this.selection;
  }

  replaceSelection(text: string): void {
    this.content = this.content.replace(this.selection, text);
    this.selection = '';
  }

  getValue(): string {
    return this.content;
  }

  setValue(value: string): void {
    this.content = value;
  }

  _setSelection(text: string): void {
    this.selection = text;
  }
}

export class ItemView {
  app: App;
  containerEl: HTMLElement;
  leaf: WorkspaceLeaf;

  constructor(leaf: WorkspaceLeaf) {
    this.leaf = leaf;
    this.app = new App();
    this.containerEl = document.createElement('div');
    this.containerEl.appendChild(document.createElement('div'));
  }

  getViewType(): string {
    return '';
  }

  getDisplayText(): string {
    return '';
  }

  getIcon(): string {
    return '';
  }

  async onOpen(): Promise<void> {}
  async onClose(): Promise<void> {}
}

export class Plugin {
  app: App;
  manifest: any;

  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  async loadData(): Promise<any> {
    return {};
  }

  async saveData(data: any): Promise<void> {}

  registerView(type: string, viewCreator: (leaf: WorkspaceLeaf) => any): void {}

  addSettingTab(tab: any): void {}

  addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement {
    return document.createElement('div');
  }

  addCommand(command: any): void {}
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display(): void {}
  hide(): void {}
}

export class Setting {
  settingEl: HTMLElement;
  infoEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    this.infoEl = document.createElement('div');
    this.nameEl = document.createElement('div');
    this.descEl = document.createElement('div');
    this.controlEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
  }

  setName(name: string): this {
    this.nameEl.textContent = name;
    return this;
  }

  setDesc(desc: string): this {
    this.descEl.textContent = desc;
    return this;
  }

  addText(cb: (text: TextComponent) => void): this {
    cb(new TextComponent(this.controlEl));
    return this;
  }

  addTextArea(cb: (text: TextAreaComponent) => void): this {
    cb(new TextAreaComponent(this.controlEl));
    return this;
  }

  addToggle(cb: (toggle: ToggleComponent) => void): this {
    cb(new ToggleComponent(this.controlEl));
    return this;
  }

  addDropdown(cb: (dropdown: DropdownComponent) => void): this {
    cb(new DropdownComponent(this.controlEl));
    return this;
  }

  addButton(cb: (button: ButtonComponent) => void): this {
    cb(new ButtonComponent(this.controlEl));
    return this;
  }
}

export class TextComponent {
  inputEl: HTMLInputElement;
  private value: string = '';

  constructor(containerEl: HTMLElement) {
    this.inputEl = document.createElement('input');
    containerEl.appendChild(this.inputEl);
  }

  setValue(value: string): this {
    this.value = value;
    this.inputEl.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  setPlaceholder(placeholder: string): this {
    this.inputEl.placeholder = placeholder;
    return this;
  }

  onChange(callback: (value: string) => void): this {
    this.inputEl.addEventListener('change', () => callback(this.inputEl.value));
    return this;
  }
}

export class TextAreaComponent {
  inputEl: HTMLTextAreaElement;
  private value: string = '';

  constructor(containerEl: HTMLElement) {
    this.inputEl = document.createElement('textarea');
    containerEl.appendChild(this.inputEl);
  }

  setValue(value: string): this {
    this.value = value;
    this.inputEl.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  setPlaceholder(placeholder: string): this {
    this.inputEl.placeholder = placeholder;
    return this;
  }

  onChange(callback: (value: string) => void): this {
    this.inputEl.addEventListener('change', () => callback(this.inputEl.value));
    return this;
  }
}

export class ToggleComponent {
  toggleEl: HTMLElement;
  private value: boolean = false;

  constructor(containerEl: HTMLElement) {
    this.toggleEl = document.createElement('div');
    containerEl.appendChild(this.toggleEl);
  }

  setValue(value: boolean): this {
    this.value = value;
    return this;
  }

  getValue(): boolean {
    return this.value;
  }

  onChange(callback: (value: boolean) => void): this {
    return this;
  }
}

export class DropdownComponent {
  selectEl: HTMLSelectElement;
  private value: string = '';

  constructor(containerEl: HTMLElement) {
    this.selectEl = document.createElement('select');
    containerEl.appendChild(this.selectEl);
  }

  setValue(value: string): this {
    this.value = value;
    return this;
  }

  getValue(): string {
    return this.value;
  }

  addOption(value: string, display: string): this {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = display;
    this.selectEl.appendChild(option);
    return this;
  }

  onChange(callback: (value: string) => void): this {
    return this;
  }
}

export class ButtonComponent {
  buttonEl: HTMLButtonElement;

  constructor(containerEl: HTMLElement) {
    this.buttonEl = document.createElement('button');
    containerEl.appendChild(this.buttonEl);
  }

  setButtonText(text: string): this {
    this.buttonEl.textContent = text;
    return this;
  }

  setCta(): this {
    return this;
  }

  onClick(callback: () => void): this {
    this.buttonEl.addEventListener('click', callback);
    return this;
  }
}

export class Notice {
  constructor(message: string, timeout?: number) {
    // Mock notice - just log in tests
  }
}

export async function requestUrl(options: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<{ status: number; json: any; text: string }> {
  return { status: 200, json: {}, text: '' };
}

export function setIcon(el: HTMLElement, icon: string): void {
  el.setAttribute('data-icon', icon);
}
