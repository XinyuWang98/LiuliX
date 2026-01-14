# 端到端全量数据集测试报告 (Chrome / Mac)

**测试日期**: 2026-01-13
**测试设备**: Mac (Agent Environment)
**浏览器**: Chrome
**测试版本**: MVP v0.1.0
**测试策略**: 串行独占测试 (Sequential Exclusive Testing)

---

## 1. 测试概览 (Summary)

| 等级 | 数据集 | 状态 | Load Time | Memory Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Small** |  | ⏳ Pending | - | - |
| **Small** |  | ⏳ Pending | - | - |
| **Medium** |  | ⏳ Pending | - | - |
| **Medium** |  | ⏳ Pending | - | - |
| **Medium** |  | ⏳ Pending | - | - |
| **Large** |  | ⏳ Pending | - | - |
| **Large** |  | ⏳ Pending | - | - |
| **Large** |  | ⏳ Pending | - | - |
| **XL** |  | ⏳ Pending | - | - |
| **XL** |  | ⏳ Pending | - | - |
| **XL** |  | ⏳ Pending | - | - |
| **XXL** |  | ⏳ Pending | - | - |
| **XXL** |  | ⏳ Pending | - | - |
| **XXXL** |  | ⏳ Pending | - | - |
| **XXXL** |  | ⏳ Pending | - | - |
| **Mega** |  | ⏳ Pending | - | - |
| **Giga** |  | ⏳ Pending | - | - |
| **Tera** |  | ⏳ Pending | - | - |

## 2. 详细测试记录 (Detailed Records)

---

## 2.1 测试集: small_sales_100.csv

- **等级**: Small
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.2 测试集: small_users_200.csv

- **等级**: Small
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.3 测试集: medium_orders_500.csv

- **等级**: Medium
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.4 测试集: medium_feedback_800.csv

- **等级**: Medium
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.5 测试集: medium_stocks_1000.csv

- **等级**: Medium
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.6 测试集: large_employees_1500.csv

- **等级**: Large
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.7 测试集: large_sensors_2000.csv

- **等级**: Large
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.8 测试集: large_webtraffic_3000.csv

- **等级**: Large
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.9 测试集: xlarge_transactions_5000.csv

- **等级**: XL
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.10 测试集: xlarge_logs_8000.csv

- **等级**: XL
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.11 测试集: xlarge_iot_20k.csv

- **等级**: XL
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.12 测试集: xxlarge_user_behavior_50k.csv

- **等级**: XXL
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.13 测试集: xxlarge_financial_80k.csv

- **等级**: XXL
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.14 测试集: xxxlarge_server_logs_100k.csv

- **等级**: XXXL
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.15 测试集: xxxlarge_ml_training_150k.csv

- **等级**: XXXL
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.16 测试集: mega_ecommerce_600k.csv

- **等级**: Mega
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.17 测试集: trips_data_1m.csv

- **等级**: Giga
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**


---

## 2.18 测试集: big_sales_2m.csv

- **等级**: Tera
- **状态**: ⏳ 待测试

### A. 性能与资源 (Phase 1, 2, 7)
| 指标 | 目标 (Green) | 实测值 | 结果 |
| :--- | :--- | :--- | :--- |
| **Load Time** | < 12s | - | - |
| **Memory Peak** | < 1.5GB | - | - |
| **TTFB (AI Suggestion)** | < 5s | - | - |
| **Insight 1st Token** | < 18s | - | - |
| **Sampling Mode** | Auto | - | - |
| **Sampling Ratio** | - | - | - |
| **Python Lib Load** | < 8s | - | - |

### B. 交互与稳定性 (Phase 3, 4)
| 测试项 | 验收标准 | 实测结果 | 通过 |
| :--- | :--- | :--- | :--- |
| **Histogram Hover** | < 100ms | - | - |
| **Worksheet Scroll** | > 45 FPS | - | - |
| **Network Resilience** | Retry Button | - | - |
| **Worker Recovery** | Auto Restart | - | - |
| **Safari Compat** | No Error | - | - |

### C. Prompt 质量与幻觉 (Phase 5)
| 指标 | 目标 | 实测值 |
| :--- | :--- | :--- |
| **Hallucination Rate** | < 5% | - |
| **Template Hit** |  | - |

### D. 并行与内存专项 (Phase 6, 7)
> *仅针对 Large 及以上数据集*

| 专项测试 | 预期 | 观察日志 |
| :--- | :--- | :--- |
| **Dynamic Memory Log** | Ratio < 20% (Full) / Sampled | - |
| **DuckDB Sampling** | Correct Row Count | - |
| **Parallel Workers** | No OOM / Race Cond | - |

### E. 测试结论 (Verdict)
- [ ] **Pass**
- [ ] **Pass with Warnings**
- [ ] **Fail**

