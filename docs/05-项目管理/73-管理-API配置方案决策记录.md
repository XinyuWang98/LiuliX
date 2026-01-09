# API 配置方案决策记录

> [!NOTE]
> **决策日期**：2026-01-09  
> **决策人**：开发团队  
> **影响范围**：前后端通信架构、Vercel 部署配置

---

## 📋 问题背景

### 发现的问题

在 MVP 上线前检查中，发现多处 API 调用存在**硬编码 URL** 问题：

1. **邀请码验证接口** (`InviteCodeModal.tsx` L33)：
   ```typescript
   const response = await fetch('http://localhost:3001/api/validate-invite-code', {...});
   ```

2. **本地模型服务** (`localLLMService.ts` L10)：
   ```typescript
   const API_BASE_URL = 'http://localhost:3001/api/model';
   ```

3. **健康检查接口** (`App.tsx` L122)：
   ```typescript
   fetch('http://localhost:3001/health', ...)
   ```

### 影响范围

- ❌ **局域网测试失败**：其他设备访问前端时无法连接后端
- ❌ **生产环境故障**：部署到 Vercel 后，前端仍尝试访问本地 3001 端口
- ❌ **多环境部署困难**：无法灵活切换测试/生产环境

### 关联文档

- [35-架构-Vercel部署风险评估与改造方案.md](../01-架构设计/35-架构-Vercel部署风险评估与改造方案.md#L17-L22)
- [71-管理-MVP上线前检查清单.md](./71-管理-MVP上线前检查清单.md#L8-L14)

---

## 🔍 方案对比分析

### 方案 A：环境变量方案

**实现方式**：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const response = await fetch(`${API_BASE_URL}/api/validate-invite-code`, {...});
```

**配置需求**：
- 本地开发：`.env` 文件设置 `VITE_API_URL=http://localhost:3001`
- Vercel 生产：环境变量设置 `VITE_API_URL=https://xxx.railway.app`

**优点**：
- ✅ 实现简单，前端直接访问后端
- ✅ 多环境切换方便（开发/测试/生产）
- ✅ 符合 12-factor app 标准
- ✅ 性能最优（无额外代理跳转）
- ✅ 与现有 `configService.ts` 技术栈一致

**缺点**：
- ⚠️ 需要配置 CORS 白名单（但已有 `cors()` 中间件）
- ⚠️ 后端地址在浏览器可见（但这是前后端分离架构的常态）

---

### 方案 B：相对路径 + 代理方案

**实现方式**：
```typescript
const response = await fetch('/api/validate-invite-code', {...});
```

**配置需求**：
- 本地开发：`vite.config.ts` proxy 配置（**已存在**）
- Vercel 生产：`vercel.json` rewrites 配置（**需新建**）

**优点**：
- ✅ 无跨域问题（浏览器认为是同源请求）
- ✅ 代码简洁（无需环境变量判断）
- ✅ 后端地址隐藏（略好的安全性）

**缺点**：
- ⚠️ **Vite Proxy 仅在开发环境生效**（`npm run build` 后失效）
- ⚠️ 必须在 Vercel 配置 rewrites（增加部署复杂度）
- ⚠️ 性能略差（多一层边缘节点代理）
- ⚠️ Vercel 免费版 rewrites 可能有配额限制
- ⚠️ 本地 + 生产环境需维护两套配置

---

## 🛡️ 安全性深度分析

### 用户能看到什么？

| 内容 | 方案 A | 方案 B | 说明 |
|------|--------|--------|------|
| **前端源代码** | ✅ 完全可见 | ✅ 完全可见 | Web 应用本质，无法隐藏 |
| **API 端点地址** | ✅ 可见 | ✅ 可见 | F12 Network 面板都能看到 |
| **后端源代码** | ❌ 不可见 | ❌ 不可见 | Node.js 服务器端执行，绝对安全 |
| **环境变量/密钥** | ❌ 不可见 | ❌ 不可见 | 存储在服务器，绝对安全 |

### 真正的安全风险

**核心结论**：暴露后端地址 **≠** 泄露代码或密钥

**实际风险**：
1. **API 滥用攻击**（与是否暴露地址无关）
   - 暴力破解邀请码
   - 刷 AI 接口耗尽配额

2. **DDoS 攻击**（与是否暴露地址无关）
   - 大量请求打垮服务器

**正确防护策略**（两种方案都需要）：
```javascript
// server/index.js 必须的安全加固

// 1. Rate Limiting
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
    windowMs: 60 * 1000,
    max: 10
}));

// 2. CORS 白名单
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
}));

// 3. 请求体大小限制
app.use(express.json({ limit: '10kb' }));
```

### Security by Obscurity 的误区

> [!WARNING]
> 隐藏后端地址是"隐蔽性安全"，不是真正的安全手段。任何技术人员打开 F12 就能看到真实请求 URL。

**业界实践**：
- Notion、Figma、ChatGPT 等 SaaS 产品的前端代码都是公开的
- 核心竞争力在于**产品体验、数据积累、运营**，而非代码隐藏

---

## ✅ 最终决策

### 采用方案：**方案 A（环境变量）+ Vite Proxy（本地辅助）**

### 决策理由

1. **技术一致性**：
   - 项目中 `configService.ts` 已使用 `import.meta.env.VITE_API_URL`
   - 统一技术方案，减少维护成本

2. **部署简单性**：
   - Vercel 只需设置环境变量（1 分钟完成）
   - 无需维护 `vercel.json` rewrites 配置

3. **性能优势**：
   - 前端直接访问后端，无额外代理跳转
   - 减少响应延迟

4. **灵活性**：
   - 多环境切换方便（本地/测试/预生产/生产）
   - 后续如需多个后端实例，只需修改环境变量

5. **风险可控**：
   - CORS 已有基础配置（`server/index.js` L23）
   - 只需限制白名单即可
   - 安全性与方案 B 无实质差异

### 混合策略

**保留 Vite Proxy 作为 fallback**：
- 如果环境变量未配置，Proxy 可以兜底（仅本地开发）
- 生产环境忽略 Proxy 配置（构建后不存在）

**实现代码**：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || ''; 
// 本地：为空 → 请求 /api/... → Vite Proxy 转发
// 生产：https://xxx.railway.app → 直接请求后端
```

---

## 📝 实施计划

### 阶段 1：代码修复（必须执行）

#### 1.1 修改硬编码 URL

**文件清单**：
- [ ] `src/components/InviteCodeModal/InviteCodeModal.tsx` (L33)
- [ ] `src/services/localLLMService.ts` (L10)
- [ ] `src/App.tsx` (L122)
- [ ] `src/components/settings/components/LocalModelSelector.tsx`（如有硬编码）

**修改模板**：
```typescript
// 修改前
const response = await fetch('http://localhost:3001/api/...', {...});

// 修改后
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const response = await fetch(`${API_BASE_URL}/api/...`, {...});
```

#### 1.2 配置环境变量

**创建 `.env` 文件**（本地开发）：
```env
# 本地开发后端地址
VITE_API_URL=http://localhost:3001
```

**创建 `.env.production` 模板**：
```env
# 生产环境后端地址（部署时填写）
VITE_API_URL=https://your-backend.railway.app
```

**Vercel 环境变量配置**：
```
Key: VITE_API_URL
Value: https://your-backend.railway.app
```

#### 1.3 后端 CORS 白名单

**修改 `server/index.js`**：
```javascript
// 修改前
app.use(cors());

// 修改后
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
}));
```

**Railway 环境变量配置**：
```
Key: ALLOWED_ORIGINS
Value: https://your-site.vercel.app,http://localhost:5173
```

---

### 阶段 2：验证测试

#### 2.1 本地环境验证
- [ ] 启动后端：`node server/index.js`
- [ ] 启动前端：`npm run dev`
- [ ] 测试邀请码验证功能
- [ ] 检查浏览器 Network 面板请求地址

#### 2.2 生产构建测试
- [ ] 运行 `npm run build`
- [ ] 检查 `dist/` 目录是否正确引用环境变量
- [ ] 预览构建结果：`npm run preview`
- [ ] 验证所有 API 调用正常

#### 2.3 部署验证
- [ ] Vercel 部署成功
- [ ] Railway 部署成功
- [ ] 端到端测试（邀请码验证、AI 功能）
- [ ] 检查 CORS 响应头是否正确

---

### 阶段 3：安全加固（推荐执行）

- [ ] 实施 Rate Limiting（防暴力破解）
- [ ] 配置 CORS 白名单（防跨域攻击）
- [ ] 添加请求体大小限制
- [ ] 配置 Railway 异常流量告警
- [ ] 敏感接口增加 Token 验证（如 AI 查询）

---

## 📚 参考文档

### 内部文档
- [35-架构-Vercel部署风险评估与改造方案.md](../01-架构设计/35-架构-Vercel部署风险评估与改造方案.md)
- [71-管理-MVP上线前检查清单.md](./71-管理-MVP上线前检查清单.md)

### 外部资源
- [Vite 环境变量配置](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel 环境变量文档](https://vercel.com/docs/projects/environment-variables)
- [12-factor App 配置原则](https://12factor.net/config)
- [OWASP API 安全 Top 10](https://owasp.org/www-project-api-security/)

---

## 🔄 变更历史

| 日期 | 变更内容 | 负责人 |
|------|---------|--------|
| 2026-01-09 | 初始决策：采用方案 A（环境变量） | Agent |
| 2026-01-09 | 明确混合策略（保留 Vite Proxy 作为 fallback） | Agent |
| 2026-01-09 | 补充安全性深度分析 | Agent |

---

## ✍️ 决策签字

- **技术负责人**：[ ] _______________
- **产品负责人**：[ ] _______________
- **审核日期**：_______________
