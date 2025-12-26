# 10-专题-数据清洗Prompt战略与MVP验证

> **文档性质**: 核心战略决策记录
> **生成时间**: 2025-12-26
> **关联文档**: `08-专题-Prompt库MVP功能设计总纲`, `68-管理-问题21清洗逻辑错误复盘`

---

## 1. 核心战略：Code-as-Policy (代码即策略)

经过深度分析，我们明确了 **Prompt 库** 在数据清洗模块中的终极应用形态，即 **"AI 生成代码，DuckDB 执行代码"**。

### 1.1 核心理念
*   **AI (Analyst)**: 负责"诊断"与"开方"。它不直接操作数据内存，而是生成确定性的 SQL 或 Python 代码。
*   **Engine (Worker)**: 负责"治疗"。DuckDB 接收 SQL 指令，高效执行数据变更。

### 1.2 优势分析
| 维度 | AI 直接执行 (Anti-Pattern) | AI 生成 SQL (Approved Pattern) |
| :--- | :--- | :--- |
| **透明度** | 黑盒 (Unknown ops) | 白盒 (Visible SQL) |
| **稳定性** | 随机性强，难回滚 | 确定性强，事务可控 |
| **性能** | 慢 (Context IO瓶颈) | 快 (In-Database Execution) |

---

## 2. 架构演进路线

### 2.1 当前状态 (V1 - Hybrid/Legacy)
*   **模式**: `aiCleaningService` 单体服务。
*   **问题**: 逻辑硬编码混合，AI 生成的复杂 SQL 曾被后端丢弃 (Bug #21)，导致 AI 沦为"摆设"。

### 2.2 目标状态 (V2 - Prompt Library Integrated)
*   **模式**: 基于 Prompt 库的通用执行流。
*   **Prompt 定义**:
    *   **Intent**: `cleaning`
    *   **Output**: `sql`
*   **流程**:
    1.  **L1 Router**: 识别数据质量问题 (如: "Format Inconsistent").
    2.  **L2 Worker**: 调取 `cleaner-normalize-format` Prompt，生成 SQL: `UPDATE t SET col = ...`.

---

## 3. MVP 验证方案：Fast Rules + On-Demand AI

为了在 MVP 阶段验证用户对"速度"与"智能"的偏好，同时不阻碍基础体验，采取以下策略：

### 3.1 双层交付策略

*   **Layer 1: 毫秒级规则 (Instant Rules)**
    *   **触发时机**: 文件加载即刻触发。
    *   **机制**: 本地硬编码规则 (JS/DuckDB Simple Queries)。
    *   **覆盖**: 去重、删空列/行、填充0/均值。
    *   **体验**: **零等待**。用户打开文件就能看到基础清洗建议。

*   **Layer 2: 按需 AI (On-Demand Intelligence)**
    *   **触发时机**: 用户点击 `[✨ 深度扫描]` 或后台静默加载完成后追加。
    *   **机制**: 调用 AI 清洗 Prompt。
    *   **覆盖**: 复杂格式标准化、正则提取、基于语义的分组、条件填充。
    *   **体验**: **高价值**。解决规则引擎搞不定的"脏活累活"。

### 3.2 关键前提 (P0)
**必须修复 Bug #21**。如果 Layer 2 (AI) 生成的建议在执行时被降级为 Layer 1 的效果，那么 A/B 测试将毫无意义。AI 的 SQL 必须拥有最高执行优先级。

---

## 4. 高级用户权限：Prompt 即规则

针对高级数据分析师的诉求，Prompt 库将充当**"可扩展规则引擎"**。

### 4.1 重新定义
*   **官方规则** = 官方维护的通用 Cleaning Prompts。
*   **用户自定义规则** = 用户编写的私有 Cleaning Prompts。

### 4.2 权限管理
允许高级用户编写特定业务的清洗 Prompt (如 "电商大促异常值剔除")，并纳入 Prompt 库管理体系：
*   **安全**: 必须通过 SQL 安全白名单校验 (`validateSQLSafety`)。
*   **预演**: 必须支持 Dry Run (`expectedImpact`) 确认后才能 Commit。
*   **共享**: 支持 Team/Public 可见性设置，沉淀团队知识。

---

## 5. 结论

1.  **方向**: 坚定不移地走 "Prompt 生成 SQL" 的路线。
2.  **落地**: MVP 阶段修复执行 Bug，采用 "快规则+慢AI" 并行策略。
3.  **未来**: 开放 Prompt 编辑器，让清洗规则从"官方定义"走向"社区共建"。
