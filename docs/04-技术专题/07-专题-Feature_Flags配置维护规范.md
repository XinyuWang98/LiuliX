# Feature Flags 配置文件维护规范

## 📁 文件结构

```
public/api/
├── feature-flags.json          # 生产环境配置（无注释，压缩格式）
└── feature-flags.template.jsonc # 开发模板（含注释，便于维护）
```

---

## 🔧 维护流程

### 新增 Feature Flag

1. **编辑模板文件** `public/api/feature-flags.template.jsonc`
   - 找到对应模块分类
   - 添加注释说明和使用位置
   - 添加 Flag 定义

2. **同步到生产配置** `public/api/feature-flags.json`
   - 复制 Flag 名称和默认值
   - 保持单行压缩格式

3. **更新代码定义** `src/config/featureFlags.ts`
   - 添加类型定义
   - 添加默认值

4. **实现功能逻辑**（⚠️ 必须添加日志上报）
   ```typescript
   import { isFeatureEnabled } from '@/config/featureFlags';
   import { logger } from '@/utils/logger';
   
   // ✅ 在关键检查点记录状态
   const flagEnabled = isFeatureEnabled('NEW_FLAG_NAME');
   logger.log('模块名', 'NEW_FLAG_NAME 状态', { data: { enabled: flagEnabled } });
   
   if (flagEnabled) {
       logger.log('模块名', 'NEW_FLAG_NAME 已启用，执行新逻辑');
       // 新逻辑
   } else {
       logger.log('模块名', 'NEW_FLAG_NAME 已禁用，使用旧逻辑');
       // 旧逻辑
   }
   ```

5. **更新文档** `docs/04-技术专题/FEATURE_FLAGS_REGISTRY.md`

### 修改 Feature Flag

1. **修改模板文件** - 更新注释和值
2. **同步生产配置** - 确保值一致
3. **验证**: `npm run check:flags`

### 删除 Feature Flag

1. **标记为 deprecated** - 在模板中添加注释
2. **90天后清理** - 使用 `/cleanup_flags` workflow
3. **删除顺序**:
   - 移除使用代码
   - 从配置文件删除
   - 从类型定义删除

---

## 📋 模块分类

### AI 功能模块
- `REAL_AI_INSIGHT` - 真实 AI 洞察生成
- `REAL_AI_CLEANING` - 真实 AI 清洗建议
- `AI_CHAT_PANEL` - AI 聊天面板
- `LOCAL_AI_MODEL` - 本地 AI 模型

### 报告导出模块
- `PDF_EXPORT` - PDF 导出功能
- `INTERACTIVE_HTML` - 交互式 HTML 报告
- `AUTO_REPORT` - 自动报告生成

### 数据源集成模块
- `GOOGLE_SHEETS` - Google Sheets 集成
- `DATABASE_CONNECT` - 数据库连接
- `API_IMPORT` - API 数据导入

### 高级功能模块
- `AGENT_MODE` - 本地 Agent 模式
- `ADVANCED_VIZ` - 高级可视化
- `COLLABORATION` - 协作功能

### 实验性功能模块
- `SKILLS_ARCHITECTURE` - Skills 架构
- `PYODIDE_OFFLINE` - Pyodide 离线模式
- `USE_AST_CODE_ENHANCER` - AST 代码增强器

### 系统控制模块
- `ENABLE_ADVANCED_API_CONFIG` - 高级 API 配置界面
- `ENABLE_INVITE_CODE_GATE` - 邀请码前置验证
- `ENABLE_EDA_CONTEXT_LOOP` - EDA 闭环与 Context 回流
- `ENABLE_UPLOAD_ROW_LIMIT` - MVP 上传行数限制

---

## 📝 模板格式

### 标准格式

```jsonc
// ========== [模块名称] ==========

// [功能完整说明]
// 使用位置：[文件路径1], [文件路径2]
"FLAG_NAME": false,
```

### 示例

```jsonc
// ========== AI 功能模块 ==========

// 真实 AI 洞察生成（当前为 Mock 数据）
// 使用位置：src/services/insights/
"REAL_AI_INSIGHT": false,

// 真实 AI 清洗建议（当前为 Mock 数据）
// 使用位置：src/services/cleaning/
"REAL_AI_CLEANING": false,
```

---

## ⚠️ 注意事项

### 文件同步

- ✅ **模板文件先行**: 先更新 `.template.jsonc`，再同步到 `.json`
- ✅ **保持一致性**: 两个文件的 Flag 名称和值必须完全一致
- ✅ **压缩格式**: `.json` 文件必须保持单行压缩格式

### 命名规范

- ✅ 使用 `UPPER_SNAKE_CASE`
- ✅ 添加前缀: `ENABLE_`, `USE_`, `SHOW_`, `HIDE_`
- ❌ 避免过于简短或模糊的名称
- ❌ 避免中文或特殊字符

### 注释规范

- ✅ 说明功能用途和当前状态
- ✅ 标注使用位置（文件路径）
- ✅ 如果是临时 Flag，注明预计移除时间
- ❌ 不要在 `.json` 文件中添加注释（会导致解析失败）

### 日志上报规范（⚠️ 强制）

**必须添加日志的场景**:
1. **模块初始化时**: 记录开关状态
2. **关键逻辑分支**: 记录走了哪个分支
3. **用户触发操作**: 记录操作时的开关状态

**示例**:
```typescript
// ✅ 正确：有日志记录
const enabled = isFeatureEnabled('NEW_FLAG');
logger.log('模块', 'XX功能状态', { data: { enabled } });
if (enabled) { /* ... */ }

// ❌ 错误：无日志记录
if (isFeatureEnabled('NEW_FLAG')) { /* ... */ }
```

**目的**: 便于排查问题时快速定位开关状态

---

## 🔄 自动化工具

### 检查 Flags 使用情况

```bash
npm run check:flags
```

**输出**:
- 使用中的 Flags
- 未使用的 Flags
- 建议归档的 Flags

### 验证配置同步

```bash
# 手动验证：比较两个文件的 Flag 列表
diff <(jq -r 'keys[]' public/api/feature-flags.json | sort) \
     <(jq -r 'keys[]' public/api/feature-flags.template.jsonc | sort)
```

---

## 📚 相关文档

- [FEATURE_FLAGS_REGISTRY.md](FEATURE_FLAGS_REGISTRY.md) - Feature Flags 详细注册表
- [06-架构-Feature_Flags远程配置API规范.md](../01-架构设计/06-架构-Feature_Flags远程配置API规范.md)
- [/new_flag Workflow](../../.agent/workflows/new_flag.md)
- [/review_flags Workflow](../../.agent/workflows/review_flags.md)
- [/cleanup_flags Workflow](../../.agent/workflows/cleanup_flags.md)

---

**最后更新**: 2026-01-14  
**维护者**: Agent + Catherine Wang
