# 06-架构-Feature Flags 远程配置 API 规范

## 📋 文档元信息

- **创建日期**: 2026-01-14
- **维护者**: Agent + Catherine Wang
- **相关模块**: `src/config/featureFlags.ts`
- **用途**: 为后端开发者提供 Feature Flags 远程配置 API 的接口规范

---

## 🎯 背景与目标

### 当前状态
前端 Feature Flags 系统已支持**三层优先级**（代码见 `src/config/featureFlags.ts:85-127`）：
1. **远程配置**（后端 API，24小时缓存）- 最高优先级
2. **本地覆盖**（localStorage 开发调试）
3. **默认配置**（硬编码兜底）

### 本文档目标
提供远程配置 API 的接口规范，确保：
- 前后端配置字段类型一致
- 缓存策略清晰可追溯
- 热更新机制安全可控

---

## 🔌 API 接口规范

### Endpoint
```
GET /api/feature-flags
```

### 请求参数
无需参数（公开接口）

### 响应格式

#### 成功响应 (200 OK)
```json
{
  "REAL_AI_INSIGHT": false,
  "REAL_AI_CLEANING": false,
  "AI_CHAT_PANEL": false,
  "LOCAL_AI_MODEL": false,
  "PDF_EXPORT": false,
  "INTERACTIVE_HTML": false,
  "AUTO_REPORT": false,
  "GOOGLE_SHEETS": false,
  "DATABASE_CONNECT": false,
  "API_IMPORT": false,
  "AGENT_MODE": false,
  "ADVANCED_VIZ": false,
  "COLLABORATION": false,
  "SKILLS_ARCHITECTURE": false,
  "PYODIDE_OFFLINE": false,
  "USE_AST_CODE_ENHANCER": true,
  "ENABLE_ADVANCED_API_CONFIG": false,
  "ENABLE_INVITE_CODE_GATE": false,
  "ENABLE_EDA_CONTEXT_LOOP": false,
  "ENABLE_UPLOAD_ROW_LIMIT": true
}
```

**返回值类型**：所有字段必须为 `boolean` 类型。

#### 错误响应

**500 Internal Server Error**：
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch feature flags configuration"
}
```

**503 Service Unavailable**（配置服务宕机时）：
```json
{
  "error": "Configuration service unavailable",
  "message": "Please try again later"
}
```

---

## 📦 完整字段列表与说明

| 字段名                       | 类型    | 默认值 | 说明                                  |
| ---------------------------- | ------- | ------ | ------------------------------------- |
| `REAL_AI_INSIGHT`            | boolean | false  | 真实 AI 洞察（当前 Mock）             |
| `REAL_AI_CLEANING`           | boolean | false  | 真实 AI 清洗建议（当前 Mock）         |
| `AI_CHAT_PANEL`              | boolean | false  | AI 聊天面板                           |
| `LOCAL_AI_MODEL`             | boolean | false  | 本地 AI 模型（MVP 阶段禁用）          |
| `PDF_EXPORT`                 | boolean | false  | PDF 导出（当前仅 HTML）               |
| `INTERACTIVE_HTML`           | boolean | false  | 交互式 HTML 报告                      |
| `AUTO_REPORT`                | boolean | false  | 自动报告生成                          |
| `GOOGLE_SHEETS`              | boolean | false  | Google Sheets 集成                    |
| `DATABASE_CONNECT`           | boolean | false  | 数据库连接                            |
| `API_IMPORT`                 | boolean | false  | API 数据导入                          |
| `AGENT_MODE`                 | boolean | false  | 本地 Agent 模式                       |
| `ADVANCED_VIZ`               | boolean | false  | 高级可视化                            |
| `COLLABORATION`              | boolean | false  | 协作功能                              |
| `SKILLS_ARCHITECTURE`        | boolean | false  | Skills 架构（已实现，默认关闭）       |
| `PYODIDE_OFFLINE`            | boolean | false  | Pyodide 离线模式                      |
| `USE_AST_CODE_ENHANCER`      | boolean | true   | AST 代码增强器（v3.0，默认开启）      |
| `ENABLE_ADVANCED_API_CONFIG` | boolean | false  | 高级 API 配置界面（MVP 阶段默认关闭） |
| `ENABLE_INVITE_CODE_GATE`    | boolean | false  | 邀请码前置验证（开发阶段关闭）        |
| `ENABLE_EDA_CONTEXT_LOOP`    | boolean | false  | EDA 闭环与 Context 回流（开发中）     |
| `ENABLE_UPLOAD_ROW_LIMIT`    | boolean | true   | MVP 强制限制上传文件行数 < 100万行    |

---

## 🔄 前端缓存策略

### 缓存机制
前端通过 `localStorage` 缓存远程配置，缓存键名：
- **配置内容**: `feature_flags_remote`
- **时间戳**: `feature_flags_remote_timestamp`

### 缓存时长
- **有效期**: 24 小时
- **过期行为**: 自动清理缓存，重新拉取最新配置

### 代码示例
```typescript
// src/config/featureFlags.ts:95-110
const remoteStored = localStorage.getItem('feature_flags_remote');
const remoteTimestamp = localStorage.getItem('feature_flags_remote_timestamp');

if (remoteStored && remoteTimestamp) {
    const age = Date.now() - parseInt(remoteTimestamp);
    if (age < 24 * 60 * 60 * 1000) {
        remoteFlags = JSON.parse(remoteStored);
    } else {
        // 缓存过期，清理
        localStorage.removeItem('feature_flags_remote');
        localStorage.removeItem('feature_flags_remote_timestamp');
    }
}
```

---

## 🚀 热更新流程

### 触发时机
1. **应用启动时**: 自动检查缓存有效期
2. **缓存过期时**: 自动拉取最新配置
3. **手动刷新**: 开发者可通过以下方式强制刷新：
   ```js
   localStorage.removeItem('feature_flags_remote');
   localStorage.removeItem('feature_flags_remote_timestamp');
   location.reload();
   ```

### 降级策略
- **远程配置失败**: 使用本地默认配置（`DEFAULT_FEATURE_FLAGS`）
- **网络超时**: 使用已缓存配置（如果未过期）
- **响应格式错误**: 使用默认配置并记录错误日志

---

## 🛡️ 安全与性能考虑

### 安全性
- **无敏感信息**: 所有 Feature Flags 为公开配置，不包含敏感数据
- **无鉴权要求**: 接口为公开访问，无需 Token
- **防篡改**: 前端仅读取配置，不提供修改接口

### 性能优化
- **24 小时缓存**: 减少不必要的网络请求
- **异步加载**: 不阻塞页面渲染，配置加载失败时使用默认值
- **CDN 加速**: 建议配置静态 JSON 文件托管至 CDN

---

## 📊 后端实现建议

### 方案 A：静态 JSON 文件（推荐 MVP 阶段）
```json
// public/api/feature-flags.json
{
  "REAL_AI_INSIGHT": false,
  "REAL_AI_CLEANING": false,
  ...
}
```

**优点**：
- 零后端成本
- CDN 加速
- 配置变更只需更新文件

**缺点**：
- 无法动态控制（需要重新部署）
- 无法按用户分组灰度发布

### 方案 B：数据库 + API（推荐生产环境）
```typescript
// Backend API (Node.js 示例)
app.get('/api/feature-flags', async (req, res) => {
    const flags = await db.getFeatureFlags();
    res.json(flags);
});
```

**优点**：
- 实时更新无需部署
- 支持 A/B 测试和灰度发布
- 可记录配置历史和回滚

**缺点**：
- 需要额外后端服务
- 需要考虑高可用和容灾

---

## 🧪 测试验证

### 前端验证步骤
1. 打开浏览器 Console
2. 执行 `getFeatureFlags()` 检查配置加载
3. 确认三层优先级逻辑：
   ```js
   // 模拟远程配置
   localStorage.setItem('feature_flags_remote', JSON.stringify({
       REAL_AI_INSIGHT: true
   }));
   localStorage.setItem('feature_flags_remote_timestamp', Date.now().toString());
   
   // 重新加载页面
   location.reload();
   
   // 验证配置生效
   console.log(getFeatureFlags().REAL_AI_INSIGHT); // 应输出 true
   ```

### 后端验证步骤
1. 部署 API 到测试环境
2. 使用 `curl` 验证响应：
   ```bash
   curl https://your-domain.com/api/feature-flags
   ```
3. 确认返回 JSON 格式正确且所有字段为 boolean 类型

---

## 📅 实施计划

| 日期        | 阶段     | 任务                          |
| ----------- | -------- | ----------------------------- |
| 1/14 (周二) | 文档阶段 | 完成 API 规范文档（本文档）   |
| 1/15 (周三) | 后端开发 | 部署静态 JSON 文件或 API 接口 |
| 1/16 (周四) | 前端验证 | 测试远程配置加载与缓存逻辑    |
| 1/17 (周五) | 上线准备 | 确认配置同步，准备生产环境    |

---

## 🔗 相关文档

- [src/config/featureFlags.ts](file:///Users/catherinewang/Documents/GitHub/LiuliX/src/config/featureFlags.ts) - 前端 Feature Flags 实现
- [74-管理-0118上线冲刺排期表.md](../05-项目管理/74-管理-0118上线冲刺排期表.md) - 上线计划

---

**最后更新**: 2026-01-14  
**下次审查**: 后端 API 部署后
