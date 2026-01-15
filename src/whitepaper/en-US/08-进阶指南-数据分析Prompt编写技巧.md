# 8. Advanced Guide: Data Analysis Prompt Engineering Techniques

> **Last Updated**: 2026-01-13

Although LiuliX AI can automatically understand data, high-quality Prompts can significantly improve analysis depth and accuracy.

---

## Writing Principles

To let AI generate accurate SQL or Pandas code, follow the **"Context-Task-Constraint"** framework:

1. **Context**: Inform AI what business meaning the data represents.
2. **Task**: Clarify the specific question you want to analyze.
3. **Constraint**: Specify output format or limiting conditions.

### Example Comparison

**Bad Prompt:**
"Analyze sales."

**Good Prompt:**
"As an e-commerce analyst (Context), please calculate the monthly total sales and month-over-month growth rate for each region (Task). Please keep two decimal places for the results and sort by sales in descending order (Constraint)."

---

## Anti-Hallucination Mechanism

LiuliX has designed a multi-layer safety net at the system level to reduce AI hallucinations:

1. **Schema Injection**: System automatically extracts column names, types, and sample data to inject into the Prompt, preventing AI from inventing non-existent columns.
2. **Two-Stage Validation**:
    - **Stage 1**: AI generates code.
    - **Stage 2**: System pre-executes code in a sandbox; if it errors, it automatically passes the error info back to AI for **Self-Correction**.

For more technical details, please refer to [**11-Tech Decode: Anti-Hallucination Engineering & Prompt Architecture**](./11-技术解密-反幻觉工程Prompt架构.md).

---

## Common Prompt Templates

### Anomaly Detection
> "Please scan the `amount` column, identify transaction records exceeding 3 standard deviations, and list their `transaction_id` and occurrence time."

### Trend Prediction
> "Based on `date` column and `daily_active_users` column, use moving average method to calculate 7-day trend, and predict the possible trend for the next 3 days."

### Association Analysis
> "Analyze the relationship between `product_category` and `return_rate` to find the category with the highest return rate."

---

**LiuliX Team**
