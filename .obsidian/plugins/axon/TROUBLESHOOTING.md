# Axon Plugin - 故障排除说明

## 当前状态
✅ **简化版已测试并工作**

## 已解决的问题

### 1. 模块导入问题
**问题**: 使用 TypeScript 编译后的 ES6 模块导入导致加载失败
**解决**: 改用内联 JavaScript 代码，避免模块加载问题

### 2. 文件权限
**问题**: manifest.json 和其他文件权限过于严格
**解决**: 所有文件权限已设置为 644

### 3. Obsidian 版本兼容性
**问题**: minAppVersion 设置过高
**解决**: 更新为 0.15.0

## 当前版本功能

✅ 右侧边栏视图
✅ 文本输入框和发送按钮
✅ 控制台输出显示
✅ 消息历史记录
✅ 清除控制台功能
✅ GitHub 风格样式
✅ 深色模式支持

## 测试结果

1. **简化测试版**: ✅ 工作正常 (显示通知)
2. **完整功能版**: ✅ 工作正常 (完整界面)

## 下一步

如果需要恢复 TypeScript 版本，原因可能是：
- esbuild 编译配置问题
- 模块导入路径问题
- TypeScript 类型检查问题

## 如何重新编译 TypeScript 版本

如果需要回到 TypeScript 版本：

```bash
# 重新编译
esbuild main.ts --bundle --outfile=main.js --platform=browser --external:obsidian
esbuild src/core/axon-view.ts --bundle --outfile=src/core/axon-view.js --platform=browser --external:obsidian
# ... 其他文件
```

## 故障排除

如果仍然失败：
1. 检查 Obsidian 开发者控制台错误
2. 确保安全模式已关闭
3. 尝试重启 Obsidian
