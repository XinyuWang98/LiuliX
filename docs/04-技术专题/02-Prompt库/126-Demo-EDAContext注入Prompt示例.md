# Demo: EDA Context 注入 Prompt 结构示例

**目标**: 展示如何将 EDA 阶段发现的 "房价在 50 万处截断" 洞察，转化为 AI 清洗代码的指令。

---

## 1. Context 数据结构 (模拟)

当用户在 Insight 卡片上点击 "Adopt" 时，系统生成的结构化 Context：

```json
{
  "dataset": {
    "name": "housing.csv",
    "rowCount": 20640,
    "columns": ["longitude", "latitude", "housing_median_age", "total_rooms", "total_bedrooms", "population", "households", "median_income", "median_house_value", "ocean_proximity"]
  },
  "adoptedInsights": [
    {
      "id": "insight-001",
      "type": "data_quality",
      "description": "median_house_value appears to be capped at 500,000.",
      "structuredData": {
        "column": "median_house_value",
        "issue": "capped_value",
        "threshold": 500000,
        "operator": ">="
      },
      "codeSnippet": "df[df['median_house_value'] >= 500000]"
    },
    {
      "id": "insight-002",
      "type": "missing_value",
      "description": "207 missing values in total_bedrooms.",
      "structuredData": {
        "column": "total_bedrooms",
        "issue": "missing_values",
        "count": 207
      }
    }
  ]
}
```

---

## 2. Prompt 模板设计

我们构建一个 "Context-Aware Cleaning Prompt"：

```handlebars
You are an expert Data Scientist.

[Task]
Write a Python script to clean the dataset 'df' for Machine Learning modeling.
Use Pandas and Scikit-Learn.

[Dataset Profile]
- Columns: {{dataset.columns}}
- Rows: {{dataset.rowCount}}

[Key Context & Constraints]
The following insights have been verified by the user. You MUST handle them:

{{#each adoptedInsights}}
KB-{{@index}}: {{this.description}}
   -> Action Required: Fix {{this.structuredData.issue}} on column '{{this.structuredData.column}}'.
{{/each}}

[User Instruction]
"Remove the capped values and impute missing data."

[Output Requirement]
- Return ONLY executable Python code.
- No markdown formatting.
- Assume 'df' is already loaded.
```

---

## 3. 渲染后的 Prompt (实际发送给 AI)

```text
You are an expert Data Scientist.

[Task]
Write a Python script to clean the dataset 'df' for Machine Learning modeling.
Use Pandas and Scikit-Learn.

[Dataset Profile]
- Columns: ["longitude", "latitude", "median_house_value", "total_bedrooms", ...]
- Rows: 20640

[Key Context & Constraints]
The following insights have been verified by the user. You MUST handle them:

KB-0: median_house_value appears to be capped at 500,000.
   -> Action Required: Fix capped_value on column 'median_house_value'.

KB-1: 207 missing values in total_bedrooms.
   -> Action Required: Fix missing_values on column 'total_bedrooms'.

[User Instruction]
"Remove the capped values and impute missing data."

[Output Requirement]
- Return ONLY executable Python code.
- No markdown formatting.
- Assume 'df' is already loaded.
```

---

## 4. AI 生成的代码 (预期)

```python
import pandas as pd
from sklearn.impute import SimpleImputer

# === Handling Context KB-0: Capped Values ===
# User verified that median_house_value is capped at 500,000.
# Strategy: Remove these records to avoid biasing the model.
initial_len = len(df)
df = df[df['median_house_value'] < 500000]
print(f"Removed {initial_len - len(df)} rows with capped median_house_value >= 500,000")

# === Handling Context KB-1: Missing Values ===
# Strategy: Impute 'total_bedrooms' with the median value.
imputer = SimpleImputer(strategy='median')
df['total_bedrooms'] = imputer.fit_transform(df[['total_bedrooms']])
print("Imputed missing values in total_bedrooms with median.")

# Validation
print("Data cleaning completed.")
print(df.info())
```

---

## 5. 结论

通过将非结构化的文本 Insight 转化为 `AnalysisContext`，再通过模板注入到 Prompt 中，我们成功让 AI "记住" 了前一步的发现，并生成了针对性的清洗代码。这验证了 closed-loop 方案的可行性。
