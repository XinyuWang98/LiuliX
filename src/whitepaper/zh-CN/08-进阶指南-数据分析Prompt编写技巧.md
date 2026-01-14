# 8. 进阶指南：数据分析 Prompt 编写技巧

> **最后更新**: 2026-01-13

虽然 LiuliX 的 AI 能够自动理解数据，但高质量的 Prompt (提示词) 能显著提升分析的深度与准确性。

---

## 编写原则

要让 AI 生成准确的 SQL 或 Pandas 代码，遵循 **"Context-Task-Constraint"** 框架：

1. **Context (背景)**：告知 AI 数据代表什么业务含义。
2. **Task (任务)**：明确你想要分析的具体问题。
3. **Constraint (约束)**：指定输出格式或限制条件。

### 示例对比

**Bad Prompt:**
"分析一下销售额。"

**Good Prompt:**
"作为电商分析师 (Context)，请计算各地区的月度销售总额和环比增长率 (Task)。结果请保留两位小数，并按销售额降序排列 (Constraint)。"

---

## 反幻觉机制 (Anti-Hallucination)

LiuliX 在系统层面设计了多重防护网来减少 AI 幻觉：

1. **Schema Injection**: 系统会自动提取列名、类型和样本数据注入到 Prompt 中，防止 AI 编造不存在的列。
2. **Two-Stage Validation**:
    - **Stage 1**: AI 生成代码。
    - **Stage 2**: 系统在沙箱中预执行代码，如果报错，自动将错误信息回传给 AI 进行自我修正 (Self-Correction)。

更多技术细节，请参考 [**11-技术解密：反幻觉工程与 Prompt 架构**](./11-技术解密-反幻觉工程Prompt架构.md)。

---

## 常用 Prompt 模板

### 异常检测
> "请扫描 `amount` 列，找出超出 3 倍标准差的异常交易记录，并列出其 `transaction_id` 和发生时间。"

### 趋势预测
> "基于 `date` 列和 `daily_active_users` 列，使用移动平均法计算 7 日趋势，并预测未来 3 天的可能走向。"

### 关联分析
> "分析 `product_category` 与 `return_rate` (退货率) 之间的关系，找出退货率最高的品类。"

---

**LiuliX Team**
