# Feature Flags 环境变量配置指南

## 快速开始

将以下环境变量添加到 `server/.env.local` 文件中：

```env
# 🔴 P0: 邀请码前置验证
ENABLE_INVITE_CODE_GATE=false    # 开发环境：false | 生产环境：true

# 🟡 P1: 高级API配置界面
ENABLE_ADVANCED_API_CONFIG=true  # 开发环境：true | 生产环境：false

# 🟢 P2: AST代码增强器
USE_AST_CODE_ENHANCER=true       # 默认：true | 紧急回滚：false
```

## Feature Flags 说明

### 1. ENABLE_INVITE_CODE_GATE（邀请码门槛）

**作用**: 控制文件上传时是否需要邀请码验证

**影响模块**:
- `src/components/data/FileUploader.tsx`
- `src/components/settings/APISettingsSimple.tsx`

**建议配置**:
- 开发环境: `false`（方便测试）
- 生产环境: `true`（必须开启）

---

### 2. ENABLE_ADVANCED_API_CONFIG（高级配置界面）

**作用**: 控制是否显示高级API配置选项

**影响模块**:
- `src/components/settings/APISettings.tsx`

**建议配置**:
- 开发环境: `true`（方便调试）
- MVP生产环境: `false`（简化用户体验）

---

### 3. USE_AST_CODE_ENHANCER（AST代码增强）

**作用**: 控制是否使用AST v3.0增强器（否则降级到v2.0正则）

**影响模块**:
- `src/services/prompts/guards/codeEnhancer.ts`

**建议配置**:
- 默认: `true`（AST v3.0已稳定上线）
- 紧急回滚: `false`（降级到v2.0）

---

## 配置步骤

### 1. 开发环境配置

编辑 `server/.env.local`：

```bash
cd server
cp .env.local .env.local.backup  # 备份现有配置
nano .env.local  # 或使用vscode等编辑器
```

添加以上3个环境变量。

### 2. 生产环境配置

**方式A: 直接设置环境变量**

```bash
export ENABLE_INVITE_CODE_GATE=true
export ENABLE_ADVANCED_API_CONFIG=false
export USE_AST_CODE_ENHANCER=true
```

**方式B: 使用.env.production文件**

```bash
# 确保生产服务器读取.env.production
NODE_ENV=production node server/index.js
```

---

## 验证配置

### 1. 启动服务器

```bash
cd server
node index.js
```

### 2. 查看日志输出

应看到类似输出：

```
✅ Feature Flags 路由已注册: GET /api/config
🚀 后端代理服务器运行于 http://localhost:3001
   - Feature Flags: http://localhost:3001/api/config
```

### 3. 测试API

```bash
curl http://localhost:3001/api/config
```

预期响应：

```json
{
  "success": true,
  "data": {
    "featureFlags": {
      "ENABLE_INVITE_CODE_GATE": false,
      "ENABLE_ADVANCED_API_CONFIG": true,
      "USE_AST_CODE_ENHANCER": true
    },
    "timestamp": 1704700800000,
    "version": "1.0.0"
  }
}
```

---

## 常见问题

### Q1: 为什么我的配置没生效？

**A**: 检查以下几点：
1. 确认 `.env.local` 文件在 `server/` 目录下
2. 重启服务器（环境变量在启动时加载）
3. 检查环境变量值是否为 `'true'` 字符串（注意引号）

### Q2: 如何在前端验证配置是否生效？

**A**: 打开浏览器控制台，运行：

```javascript
// 检查配置加载日志
// 应看到: [配置服务] 远程配置加载成功

// 手动获取配置
import { getFeatureFlags } from '@/config/featureFlags';
console.log(getFeatureFlags());
```

### Q3: 生产环境如何快速回滚AST增强器？

**A**: 
1. 设置环境变量: `export USE_AST_CODE_ENHANCER=false`
2. 重启服务器: `pm2 restart server`
3. 前端会在下次请求时自动获取新配置（最多延迟24小时）

---

**创建时间**: 2026-01-08  
**维护者**: Antigravity Agent
