---
description: 前端代码修改的标准验证流程（确保开发环境正常运行，避免在错误环境下工作）
---

# 🎨 前端代码验证工作流 (/verify_frontend)

修改前端代码（React/CSS/TypeScript）时，请严格遵循此流程。此workflow能帮助快速定位环境问题，避免浪费时间在"修改未生效"的调试上。

---

## ⚡ 快速检查清单 (30秒)

修改任何前端代码前，先执行以下检查：

```bash
# 1. 检查Vite进程是否运行
lsof -ti:5173 && echo "✅ Vite运行中" || echo "❌ Vite未运行"

# 2. 检查后端进程是否运行
lsof -ti:3000 && echo "✅ Backend运行中" || echo "❌ Backend未运行"

# 3. 查看最近的编译日志（如果有的话）
tail -5 vite.log 2>/dev/null || echo "ℹ️  无Vite日志文件"
```

**如果Vite未运行**，立即执行：
```bash
npm run dev
```

**等待Vite启动完成** (通常200-500ms)，看到 `ready in XXXms` 后再继续。

---

## 📋 标准验证流程 (5分钟)

### 1. 环境健康检查 (30秒)

**强制要求**：修改前执行上方"快速检查清单"

**如果发现问题**：
- Vite未运行 → 启动 `npm run dev`
- 端口被占用 → 查找并终止冲突进程
- 依赖缺失 → 执行 `npm install`

---

### 2. 修改代码并确认编译 (1分钟)

1. **编辑文件**并保存
2. **立即查看终端**，等待HMR日志：
   ```
   [vite] hmr update /src/components/xxx.tsx
   ```
3. **如果2秒内无日志**：
   - 检查文件是否真的保存了
   - 检查Vite进程是否crash
   - 查看终端是否有TypeScript错误

**常见TypeScript错误处理**：
- 如果有TS错误，**必须先修复错误**
- Vite会继续运行但不会更新有错误的模块
- 修复错误后会自动触发HMR

---

### 3. 浏览器验证 (DevTools优先) (2分钟)

**标准操作顺序**（严格按此顺序）：

#### Step 1: 打开DevTools
```
F12 或 Cmd+Opt+I
```

#### Step 2: 配置Network Tab
- 切换到 **Network** 标签
- ✅ 勾选 **Disable cache**
- ✅ 勾选 **Preserve log** (可选)

#### Step 3: 硬刷新页面
```
Cmd+Shift+R (Mac)
Ctrl+Shift+F5 (Windows)
```

#### Step 4: 检查文件加载 (关键步骤)
在Network Tab中搜索你修改的文件：
- **CSS文件**: 搜索文件名，检查：
  - ✅ 状态码是否为 `200`？
  - ✅ Size是否不是 `(disk cache)`？
  - ✅ Time是否是最近的时间戳？
- **JS/TSX文件**: 类似检查

**如果文件未重新加载**：
1. 回到Step 2检查HMR日志
2. 检查Vite是否正常运行
3. 尝试完全重启Vite

#### Step 5: 检查Console
- ✅ 是否有新的报错？
- ✅ 是否有HMR相关日志？
- ✅ 是否有CSS warning？

#### Step 6: 最后验证功能
**只有前面5步都通过后**，才查看页面功能是否正常。

---

### 4. CSS修改特别注意事项

CSS修改如果不生效，**99%是以下原因**：

#### 原因1: Vite未检测到文件变化
**症状**: 终端无HMR日志  
**解决**: 
```bash
# 触发文件变更
touch src/components/YourComponent.css
# 或者在文件末尾添加空行/注释
```

#### 原因2: 浏览器缓存
**症状**: Network显示 `(disk cache)`  
**解决**: 硬刷新 (Cmd+Shift+R)

#### 原因3: CSS被覆盖
**症状**: DevTools Elements中看到样式被划掉  
**解决**: 
- 检查CSS优先级（!important, 选择器权重）
- 查看是否有其他样式覆盖

#### 原因4: 选择器错误
**症状**: 样式规则根本没有匹配到元素  
**解决**: 
```javascript
// 在浏览器Console执行
document.querySelector('.your-class-name')
// 如果返回null，说明选择器错误
```

---

## 🚨 快速故障排除

### 问题: "修改了代码但浏览器没变化"

**标准排查顺序**:

1. **检查Vite是否运行** (5秒)
   ```bash
   lsof -ti:5173
   ```
   ❌ 未运行 → `npm run dev`

2. **检查HMR日志** (5秒)
   - 查看终端是否有 `[vite] hmr update` 日志
   - ❌ 无日志 → 文件可能未保存或Vite未监听此文件

3. **检查TypeScript错误** (10秒)
   - 查看终端是否有红色TS错误
   - ❌ 有错误 → 先修复TS错误

4. **检查浏览器缓存** (10秒)
   - DevTools Network tab
   - ❌ 显示 `(disk cache)` → 硬刷新

5. **检查文件是否正确导入** (20秒)
   ```bash
   # 搜索文件导入
   grep -r "import.*YourFile" src/
   ```

6. **最后手段: 重启Vite** (30秒)
   ```bash
   # 终止Vite
   lsof -ti:5173 | xargs kill
   # 重新启动
   npm run dev
   ```

---

### 问题: "CSS样式不生效"

**检查清单**:

```javascript
// 在浏览器Console依次执行：

// 1. 检查元素是否存在
document.querySelector('.your-selector')
// ✅ 返回元素 → 选择器正确
// ❌ 返回null → 选择器错误

// 2. 检查计算后的样式
const el = document.querySelector('.your-selector');
window.getComputedStyle(el).color; // 替换为你的属性
// 检查是否是你期望的值

// 3. 查找CSS规则
[...document.styleSheets].map(s => {
  try { return [...s.cssRules].filter(r => 
    r.selectorText && r.selectorText.includes('your-class')
  )} catch(e) { return [] }
}).flat()
// ✅ 找到规则 → CSS已加载
// ❌ 空数组 → CSS未加载或选择器错误
```

---

### 问题: "React组件未更新"

**可能原因**:

1. **Props未变化**: 检查父组件是否真的传了新props
2. **State未更新**: 检查是否直接修改了state (不允许)
3. **useMemo/useCallback依赖**: 检查依赖数组
4. **React DevTools**: 安装并检查组件树

**验证组件是否重新渲染**:
```typescript
// 在组件内添加临时日志
useEffect(() => {
  console.log('Component rendered', { props, state });
});
```

---

## ✅ 成功标准

验证通过需满足**所有**以下条件：

- [ ] Vite进程运行正常 (端口5173)
- [ ] 修改文件后终端显示HMR日志
- [ ] 浏览器Network显示文件重新加载 (200, 非缓存)
- [ ] Console无新增错误
- [ ] DevTools Elements显示正确的CSS规则
- [ ] 功能按预期工作

---

## 📝 注意事项

1. **永远DevTools优先**: 先看Network/Console，再看页面效果
2. **不要跳过HMR日志检查**: 2秒内无日志 = 一定有问题
3. **硬刷新是好习惯**: 每次验证都用 Cmd+Shift+R
4. **TS错误必须修**: Vite不会更新有错误的模块
5. **怀疑时就重启**: 重启Vite只需30秒，省时省力

---

## 🔧 相关命令速查

```bash
# 启动开发服务器
npm run dev

# 检查端口占用
lsof -ti:5173  # Vite
lsof -ti:3000  # Backend

# 终止进程
lsof -ti:5173 | xargs kill

# 类型检查
npm run type-check

# 完整验证（类型+i18n+Flags等）
npm run dev  # 会自动运行所有检查

# 清理缓存（如果怀疑缓存问题）
rm -rf node_modules/.vite
npm run dev
```

---

**最后更新**: 2026-01-21  
**来源**: 从"序号列Sticky定位修复"任务中总结的经验教训
