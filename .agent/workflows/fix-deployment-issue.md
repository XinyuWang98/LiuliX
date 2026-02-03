---
description: Vercel部署失败快速排查指南
---

# 部署问题排查 Workflow

部署失败？按照此流程逐步诊断。

---

## ❌ 问题1: Build Failed

### 症状
Vercel Deployment Status: ● Error

### 诊断步骤

1. 查看Build Logs
   - Dashboard → Deployments → 点击失败部署 → Build Logs
   - 查看最后的错误信息

2. 常见错误类型

   **TypeScript编译错误**：
   ```
   error TS6133: 'code' is declared but never read
   ```
   **解决**：
   ```typescript
   // Before
   function test(code: string) { }
   
   // After（添加下划线前缀）
   function test(_code: string) { }
   ```

   **Import路径错误**：
   ```
   Cannot find module '@/xxx'
   ```
   **解决**：检查 `tsconfig.json` 路径别名配置

   **依赖缺失**：
   ```
   Cannot find package 'xxx'
   ```
   **解决**：
   ```bash
   npm install xxx
   git add package.json package-lock.json
   git commit -m "fix: add missing dependency"
   git push
   ```

---

## ❌ 问题2: API返回HTML而非JSON

### 症状
```
POST /api/validate-invite-code 500
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### 根本原因
Vercel Deployment Protection拦截了API请求，返回SSO登录页面

### 解决方案（3分钟）

1. 访问 Vercel Dashboard
2. Settings → Deployment Protection
3. 关闭以下选项：
   - ❌ Vercel Authentication
   - ❌ Password Protection
4. 保存设置
5. Redeploy（可使用existing build cache加快速度）

**验证**：
```bash
curl -X POST https://[your-url]/api/validate-invite-code \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST"}'

# 应返回JSON而非HTML
```

---

## ❌ 问题3: Git Push被拒绝（Large File）

### 症状
```
remote: error: File LiuliX-Demo-Video_副本.mov is 288.50 MB;
this exceeds GitHub's file size limit of 100.00 MB
error: failed to push
```

### 解决方案（5分钟）

1. 回滚最后的commit
   ```bash
   git reset --soft HEAD~1
   ```

2. 移除大文件
   ```bash
   # 查看大文件
   git diff --cached --stat | awk '$5 > 10000000'
   
   # 删除
   rm "LiuliX-Demo-Video_副本.mov"
   ```

3. 添加到.gitignore
   ```bash
   echo "*.mov" >> .gitignore
   echo "*.mp4" >> .gitignore
   echo "*_副本.*" >> .gitignore
   ```

4. 重新提交并推送
   ```bash
   git add .
   git commit -m "feat: your changes (removed large files)"
   git push origin V1.0.2
   ```

---

## ❌ 问题4: UI改动未生效

### 症状
部署成功，但UI看起来是旧版本

### 诊断步骤

**Step 1: 确认访问正确URL**
```bash
vercel ls liulix
```
确保访问的是**最新部署URL**（列表最上面）

**常见错误**：
- ❌ 访问分支URL（`git-v101-...`）→ 可能有缓存
- ✅ 访问部署URL（`7o9bpem0k-...`）→ 精确对应commit

**Step 2: 检查commit是否包含UI改动**
```bash
git log -1 --stat | grep -E 'components|styles|VirtualDataGrid'
```

**如果无输出** → UI改动未提交！

**解决**：
```bash
# 1. 检查工作区
git status

# 2. 提交所有UI改动
git add src/components/ src/styles/
git commit -m "feat(ui): UI improvements"
git push

# 3. 等待新部署完成
```

**Step 3: 清除浏览器缓存**
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

---

## ❌ 问题5: 环境变量未生效

### 症状
API调用失败，日志显示 `undefined` 或 `null`

### 解决方案

1. 检查环境变量是否配置
   ```bash
   vercel env ls
   ```

2. 确认环境范围覆盖
   **常见错误**：只添加到Production，忘记Preview
   
   **正确配置**：
   - Production ✅
   - Preview ✅  ← **容易忘记**
   - Development ✅

3. 修改环境变量后
   ```bash
   # ⚠️ 环境变量改动不会自动重新部署！
   # 必须手动触发redeploy或推送新commit
   ```

---

## ❌ 问题6: 访问旧部署URL

### 症状
用户反馈看到旧版本，但你确认部署成功

### 诊断

**检查URL类型**：

| URL类型    | 示例                | 特点                     |
| ---------- | ------------------- | ------------------------ |
| 分支URL    | `git-v101-...`      | 持久化，可能有缓存延迟   |
| 部署URL    | `7o9bpem0k-...`     | 精确对应commit，立即生效 |
| Production | `liulix.vercel.app` | 主域名                   |

**解决**：
```bash
# 获取最新部署URL
vercel ls liulix | head -n 5

# 复制第一个（最新）URL给用户
```

---

## 🆘 终极排查方案

如果以上都无效：

### 1. 检查Vercel状态
- https://www.vercel-status.com/
- 确认Vercel服务正常

### 2. 查看Runtime Logs
- Dashboard → Logs
- 查看实时错误日志
- 搜索关键词（如错误码、函数名）

### 3. 本地复现
```bash
# 启动Vercel本地环境
vercel dev --listen 3002

# 测试API
curl http://localhost:3002/api/xxx
```

### 4. 对比工作版本
```bash
# 查看部署历史
vercel ls liulix

# 找到最后一个工作版本
# 对比代码差异
git diff <working-commit> <current-commit>
```

---

## 📞 需要人工协助时

提供以下信息：

1. **部署URL**：`https://liulix-xxx.vercel.app`
2. **错误症状**：截图 + 错误信息
3. **Build Logs**：复制关键错误行
4. **Runtime Logs**：相关错误日志
5. **已尝试步骤**：列出本workflow中已执行的步骤

---

**创建时间**：2026-02-03  
**基于**：V1.0.2部署复盘（6个问题）
