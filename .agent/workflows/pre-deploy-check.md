---
description: Vercel部署前完整检查清单，防止常见部署问题
---

# Pre-deployment检查 Workflow

// turbo-all

在执行 `/vercel-deploy` 前运行此workflow，确保部署万无一失。

---

## Step 1: Git工作区检查

1. 检查未提交文件
   ```bash
   git status --short
   ```
   
   **预期结果**：
   - ✅ 空输出 → 所有改动已提交
   - ❌ 有输出 → 有未提交文件

   **❌ 如果有未提交文件**：
   ```bash
   # 查看具体改动
   git diff
   
   # 决策：
   # - UI/功能代码 → 必须commit后再部署
   # - 临时文件 → 添加到.gitignore
   # - 大文件 → 移除或使用Git LFS
   ```

2. 检查当前分支
   ```bash
   git branch --show-current
   ```
   
   **确认部署目标**：
   - `V1.0.2` → Preview环境
   - `main` → Production环境

---

## Step 2: 代码质量检查

3. TypeScript类型检查
   ```bash
   npm run type-check
   ```
   
   **预期**：无错误输出
   
   **❌ 常见错误修复**：
   - `TS6133: 'xxx' is never used` → 添加下划线前缀 `_xxx`
   - `TS2353: Object缺少属性` → 补全类型定义

4. 本地构建测试
   ```bash
   npm run build
   ```
   
   **预期**：构建成功，生成 `dist/` 目录
   
   **❌ 如果失败**：修复错误后重新运行步骤3-4

---

## Step 3: 大文件检测

5. 检查staged文件大小
   ```bash
   git diff --cached --stat | awk '$5 > 100000000 {print "⚠️  "$1" ("$5" bytes)"}'
   ```
   
   **预期**：无输出
   
   **❌ 如果有大文件（>100MB）**：
   ```bash
   # 回滚commit
   git reset --soft HEAD~1
   
   # 移除大文件
   rm <大文件名>
   
   # 添加到.gitignore
   echo "<文件模式>" >> .gitignore
   
   # 重新commit
   git add .
   git commit -m "..."
   ```

6. 验证.gitignore规则
   ```bash
   grep -E '(*.mov|*.mp4|*.avi|*.zip)' .gitignore
   ```
   
   **预期**：媒体文件后缀已在.gitignore中

---

## Step 4: Vercel环境检查

7. 确认环境变量完整性
   ```bash
   vercel env ls
   ```
   
   **必需变量清单**（LiuliX项目）：
   - `VALID_INVITE_CODES` ✅
   - `DEEPSEEK_API_KEY_CLEANING` ✅
   - `DEEPSEEK_API_KEY_INSIGHT` ✅
   - `INVITE_CODE_TOTAL_LIMIT` ✅
   - `ENABLE_FREE_TRIAL_LIMIT` ✅
   
   **❌ 如果缺少变量**：
   - 访问 Vercel Dashboard → Settings → Environment Variables
   - 添加缺失变量到所有环境（Production + Preview + Development）
   - **注意**：添加后需要重新部署才能生效

8. 检查Deployment Protection设置
   
   **LiuliX配置**（公开应用，使用自带邀请码验证）：
   - Preview: ❌ **必须关闭**
   - Production: ❌ **必须关闭**
   
   **验证方式**：
   - Dashboard → Settings → Deployment Protection
   - 确认 "Vercel Authentication" 和 "Password Protection" 都已关闭

---

## Step 5: 最终确认

9. Pre-deployment Checklist
   
   - [ ] `git status` clean（或已确认未提交文件可忽略）
   - [ ] `npm run type-check` 通过
   - [ ] `npm run build` 成功
   - [ ] 无大文件（>100MB）
   - [ ] Vercel环境变量完整
   - [ ] Deployment Protection已关闭

**✅ 全部通过** → 执行 `/vercel-deploy`

**❌ 有任一失败** → 修复后重新运行此workflow
