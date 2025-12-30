# Kaggle 测试数据集方案（MVP 内部测试）

**创建时间**: 2025-12-30  
**用途**: LiuliX MVP 功能测试（非用户功能）  
**优先级**: P0（立即可用，30分钟完成）

---

## 一、需求澄清

### 🎯 **使用场景**

用于团队内部 MVP 测试，**不是给最终用户**：
1. **功能验证**: 测试清洗、洞察、报告模块
2. **性能测试**: 验证不同数据规模性能
3. **演示 Demo**: 产品展示时快速加载
4. **Prompt 调试**: 用标准数据验证 Prompt 效果

---

## 二、最简方案：预置数据集

无需 API 集成，直接下载到 `public/sample-data/`

### 📦 **推荐测试数据集**

| 数据集      | 行数 | 列数 | 大小  | 用途           |
| ----------- | ---- | ---- | ----- | -------------- |
| **Titanic** | 891  | 12   | 60KB  | 分类、清洗测试 |
| **Iris**    | 150  | 5    | 4KB   | 最小测试集     |
| **Housing** | 20K  | 10   | 1.5MB | 回归、性能测试 |

---

## 三、实施步骤（30 分钟）

### Step 1: 下载数据集（5 分钟）

```bash
cd /Users/catherinewang/Documents/GitHub/LiuliX
mkdir -p public/sample-data
cd public/sample-data

# 下载 3 个经典数据集
curl -L -o titanic.csv "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
curl -L -o iris.csv "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"
curl -L -o housing.csv "https://raw.githubusercontent.com/ageron/handson-ml/master/datasets/housing/housing.csv"
```

### Step 2: 创建配置（5 分钟）

```json
// public/sample-data/datasets.json
{
  "datasets": [
    {
      "id": "titanic",
      "name": "Titanic - 生存预测",
      "file": "titanic.csv",
      "rows": 891,
      "columns": 12,
      "description": "经典分类问题"
    },
    {
      "id": "iris",
      "name": "Iris - 鸢尾花分类",
      "file": "iris.csv",
      "rows": 150,
      "columns": 5,
      "description": "最简单的测试集"
    },
    {
      "id": "housing",
      "name": "Housing - 房价预测",
      "file": "housing.csv",
      "rows": 20640,
      "columns": 10,
      "description": "回归 + 性能测试"
    }
  ]
}
```

### Step 3: UI快速入口（20 分钟）

在 `EmptyStateWelcome` 添加"开发模式"快速加载按钮：

```typescript
// 仅开发环境显示
{import.meta.env.DEV && (
  <div className="dev-quick-load">
    <button onClick={() => loadSampleData('titanic')}>
      🚢 加载 Titanic
    </button>
    <button onClick={() => loadSampleData('iris')}>
      🌸 加载 Iris
    </button>
    <button onClick={() => loadSampleData('housing')}>
      🏠 加载 Housing
    </button>
  </div>
)}

// 加载逻辑
const loadSampleData = async (id: string) => {
  const response = await fetch(`/sample-data/${id}.csv`);
  const text = await response.text();
  const file = new File([text], `${id}.csv`, { type: 'text/csv' });
  handleFileUpload(file); // 调用现有上传逻辑
};
```

---

## 四、与 API 方案对比

| 维度         | 预置数据集（推荐） | Kaggle API |
| ------------ | ------------------ | ---------- |
| **实施时间** | 30 分钟            | 2-3 天     |
| **适用场景** | **MVP 测试**       | 用户功能   |
| **网络依赖** | 无（本地）         | 有         |
| **数据量**   | 3-5 个精选         | 50,000+    |

---

## 五、建议

### 🚀 **立即行动**（现在就可以做）

1. 下载 3 个数据集到 `public/sample-data/`
2. 添加快速加载按钮（开发模式）
3. 开始测试所有功能模块

### 📋 **测试优先级**

```
P0: Titanic（891行，适中复杂度，有缺失值）
P1: Iris（150行，最简单）
P2: Housing（20K行，性能测试）
```

---

**需要我现在帮您执行下载命令吗？**
