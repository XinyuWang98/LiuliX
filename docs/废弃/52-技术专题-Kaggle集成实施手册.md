# 技术专题：Kaggle 集成实施手册 (Step-by-Step)

> [!NOTE]
> **目标读者**：开发者  
> **状态**：❌ **已废弃** (2025-12-22)  
> **原因**：战略调整，放弃Kaggle方案  
> **替代方案**：[53-技术专题-Skills官方资源提炼方案](53-技术专题-Skills官方资源提炼方案.md)  
> **前置条件**：无

> [!CAUTION]
> **本文档仅作存档参考，请勿实施本方案。**

---

## 📋 总览：三阶段任务清单

- [ ] **Phase 1**: 环境准备 (30分钟)
- [ ] **Phase 2**: Proxy 服务搭建 (1-2小时)
- [ ] **Phase 3**: 首个 Skill 提炼验证 (1小时)

---

## Phase 1: 环境准备 (30分钟)

### Step 1.1: 获取 Kaggle API Key

1. **登录 Kaggle**：访问 https://www.kaggle.com/
2. **进入账户设置**：
   - 点击右上角头像 → `Settings`
   - 或直接访问：https://www.kaggle.com/settings/account
3. **生成 API Token**：
   - 滚动到 **"API"** 区域
   - 点击 `Create New Token` 按钮
   - 浏览器会自动下载一个 `kaggle.json` 文件
4. **查看 API Key**：
   ```json
   {
     "username": "your_username",
     "key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   }
   ```
5. **安全存储**：
   - ⚠️ **切勿提交到 Git**
   - 建议放在 `~/.kaggle/kaggle.json` (Linux/Mac) 或 `C:\Users\<你的用户名>\.kaggle\kaggle.json` (Windows)

---

### Step 1.2: 创建独立仓库

1. **初始化仓库**：
   ```bash
   mkdir dataprism-internal-tools
   cd dataprism-internal-tools
   git init
   npm init -y
   ```

2. **安装依赖**：
   ```bash
   npm install express axios adm-zip dotenv
   npm install --save-dev @types/node @types/express typescript
   ```

3. **创建 `.env` 文件**：
   ```env
   KAGGLE_USERNAME=your_username
   KAGGLE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   PORT=8888
   ```

4. **添加 `.gitignore`**：
   ```
   node_modules/
   .env
   *.log
   kaggle.json
   ```

---

## Phase 2: Proxy 服务搭建 (1-2小时)

### Step 2.1: 创建 Proxy 服务器

创建 `server.js`：

```javascript
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 8888;

// CORS 配置（仅开发环境）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Kaggle API 基础配置
const KAGGLE_API = 'https://www.kaggle.com/api/v1';
const auth = {
  username: process.env.KAGGLE_USERNAME,
  password: process.env.KAGGLE_KEY
};

// 路由 1: 搜索数据集
app.get('/kaggle/datasets/list', async (req, res) => {
  try {
    const response = await axios.get(`${KAGGLE_API}/datasets/list`, {
      auth,
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 路由 2: 下载数据集（流式）
app.get('/kaggle/datasets/download/:owner/:slug', async (req, res) => {
  try {
    const { owner, slug } = req.params;
    const url = `${KAGGLE_API}/datasets/download/${owner}/${slug}`;
    
    const response = await axios.get(url, {
      auth,
      responseType: 'arraybuffer'
    });

    // 解压 Zip（假设只有一个 CSV 文件）
    const zip = new AdmZip(response.data);
    const zipEntries = zip.getEntries();
    const csvEntry = zipEntries.find(e => e.entryName.endsWith('.csv'));

    if (csvEntry) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${csvEntry.entryName}"`);
      res.send(csvEntry.getData());
    } else {
      res.status(404).json({ error: 'No CSV file found in dataset' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 路由 3: 获取 Kernel 代码
app.get('/kaggle/kernels/pull/:owner/:slug', async (req, res) => {
  try {
    const { owner, slug } = req.params;
    const response = await axios.get(`${KAGGLE_API}/kernels/pull/${owner}/${slug}`, { auth });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Kaggle Proxy running on http://localhost:${PORT}`);
  console.log(`✅ Authenticated as: ${auth.username}`);
});
```

---

### Step 2.2: 测试 Proxy

1. **启动服务**：
   ```bash
   node server.js
   ```

2. **测试搜索**（在浏览器或 Postman）：
   ```
   GET http://localhost:8888/kaggle/datasets/list?search=titanic
   ```

3. **测试下载**：
   ```
   GET http://localhost:8888/kaggle/datasets/download/heptapod/titanic
   ```

4. **预期结果**：
   - 搜索：返回包含 "titanic" 的数据集列表 JSON
   - 下载：浏览器自动下载 `train.csv` 文件

---

## Phase 3: 首个 Skill 提炼验证 (1小时)

### Step 3.1: 下载目标 Notebook

1. **选择高分 Notebook**：
   - 访问：https://www.kaggle.com/code
   - 搜索："titanic exploratory data analysis"
   - 选择 Vote 数 > 1000 的 Notebook

2. **通过 API 拉取代码**：
   ```bash
   curl http://localhost:8888/kaggle/kernels/pull/alexisbcook/titanic-tutorial > titanic_notebook.json
   ```

---

### Step 3.2: 人工提炼 Skill

打开 `titanic_notebook.json`，找到类似这样的代码块：

```python
# 原始 Kaggle 代码
df['Age'].fillna(df['Age'].median(), inplace=True)
```

**提炼为通用 Skill**：

```typescript
// src/services/skills/builtins/clean_fill_median.ts
export const CLEAN_FILL_MEDIAN: SkillDefinition = {
  name: 'clean_fill_median',
  description: '用中位数填补指定列的缺失值',
  parameters: {
    table: { type: 'string', required: true },
    column: { type: 'string', required: true }
  }
};

// Dispatcher 实现
async executeCleanFillMedian(args: { table: string; column: string }) {
  const sql = `
    UPDATE ${args.table}
    SET "${args.column}" = (
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "${args.column}")
      FROM ${args.table}
      WHERE "${args.column}" IS NOT NULL
    )
    WHERE "${args.column}" IS NULL
  `;
  await this.duckdb.query(sql);
  return { success: true, message: `已用中位数填补 ${args.column} 列的缺失值` };
}
```

---

### Step 3.3: 验证 Skill

1. **注册 Skill**：
   ```typescript
   // src/services/skills/registry.ts
   import { CLEAN_FILL_MEDIAN } from './builtins/clean_fill_median';
   
   skillRegistry.register(CLEAN_FILL_MEDIAN);
   ```

2. **浏览器测试**：
   ```javascript
   // F12 Console
   await skillsDispatcher.execute('clean_fill_median', {
     table: 't_1234567890_working',
     column: 'Age'
   });
   ```

3. **预期结果**：
   - Console 输出：`{ success: true, message: "已用中位数填补 Age 列的缺失值" }`
   - 数据表中 Age 列的 NULL 值被替换为中位数

---

## 🎯 验收标准

### Phase 1 完成标志：
- [ ] 成功获取 `kaggle.json`
- [ ] 独立仓库已初始化，依赖已安装

### Phase 2 完成标志：
- [ ] Proxy 服务能成功搜索数据集
- [ ] 能下载并自动解压 CSV 文件
- [ ] 能拉取 Kernel 代码 (JSON格式)

### Phase 3 完成标志：
- [ ] 至少提炼出 1 个可运行的 Skill
- [ ] 该 Skill 已在浏览器中验证通过

---

## 📌 常见问题 (FAQ)

**Q1: Kaggle API 报 401 Unauthorized？**  
A: 检查 `.env` 中的 `KAGGLE_USERNAME` 和 `KAGGLE_KEY` 是否正确。

**Q2: 下载的 Zip 文件损坏？**  
A: 确认 Axios 使用了 `responseType: 'arraybuffer'`。

**Q3: 如何找到数据集的 `owner/slug`？**  
A: 数据集 URL 格式为 `kaggle.com/datasets/{owner}/{slug}`，例如：  
   `kaggle.com/datasets/heptapod/titanic` → `heptapod/titanic`

**Q4: Proxy 服务可以部署到云端吗？**  
A: 可以，但必须确保：
   1. 使用环境变量存储 API Key
   2. 添加 IP 白名单限制
   3. 启用 HTTPS

---

## 🚀 下一步

完成 Phase 1-3 后，可以继续：
1. **扩展 Skill 库**：提炼更多通用 Skill（相关性分析、异常值检测等）
2. **AI 适配层**：尝试用 LLM 自动转换 Notebook 代码
3. **质量评估**：建立 Skill 测试套件，确保稳定性

---

**附录**：Kaggle API 官方文档 → https://github.com/Kaggle/kaggle-api
