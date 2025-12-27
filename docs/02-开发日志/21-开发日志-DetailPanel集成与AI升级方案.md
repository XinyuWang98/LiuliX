# DetailPanel集成与AI升级方案开发日志

**日期**: 2025-12-27  
**作者**: AI Assistant  
**里程碑**: DetailPanel两列布局集成 + AI清洗/模型升级规划

---

## 一、DetailPanel集成完成

### 1.1 目标

将Focus Mode的DetailPanel组件集成到现有Insight Chain，替换原有的垂直堆叠布局为两列布局（图+分析 | 代码）。

### 1.2 实施内容

**修改文件**：
- `src/components/insights/InsightTreeNode.tsx`

**关键变更**：
1. 导入`DetailPanel`组件
2. 将121-166行的垂直布局替换为`DetailPanel`
3. 数据映射：
   - `result.image` → `chartImage`
   - `result.summary` → `insight`
   - `result.code` → `code`

**布局结构**：
```
左列（上下堆叠）:
├─ 图表（400px高度）
└─ AI分析报告

右列:
└─ Python代码（可滚动，max-height: 600px）
```

### 1.3 验证结果

**浏览器验证**（2025-12-27 00:56）：
- ✅ DOM结构正确：`.detail-panel__viz-code-section` (display: flex, flex-direction: row)
- ✅ 左右并列显示：左列（图+分析），右列（代码）
- ✅ 旧布局类名已消失：`.insight-chart-area`, `.insight-summary-section`
- ✅ 交互功能正常：采纳/忽略按钮、图表缩放/下载、代码复制

**截图证明**：
- `insight_detail_panel_layout_1766768144701.png`
- `detail_panel_verification_1766768280130.png`

---

## 二、Qwen 3B模型切换可行性评估

### 2.1 评估范围

- 数据清洗建议功能
- 洞察生成建议功能

### 2.2 架构分析

#### 数据清洗建议

**实际实现**（`aiCleaningService.ts`）：
- **工作流程**：数据脱敏 → Prompt压缩 → AI调用 → 三层校验
- **AI任务**：理解质量问题 → 生成DuckDB SQL → 输出JSON
- **Prompt大小**：~2498字符（约1666 tokens）
- **输出示例**：4条建议，耗时25.4秒

**复杂度**：
- ✅ 理解数据质量问题（缺失率、重复行）
- ✅ 生成DuckDB SQL（CREATE/UPDATE/SELECT）
- ✅ 输出JSON格式（浅层结构，2-5个对象）

#### 洞察生成建议

**实际实现**（`routerPrompt.ts`）：
- **工作流程**：数据列信息 → AI Router → SQL Inflater → Python执行
- **AI任务**：从18个模板中选择3-5个 + 填充列名参数
- **Prompt大小**：远小于清洗（仅模板清单）
- **输出示例**：5条推荐，5个含下钻

**复杂度**：
- ✅ 理解数据特征
- ✅ 匹配模板（类似多选题）
- ✅ 填充参数（列名）
- ✅ 输出JSON

### 2.3 评估结论

**总体可行性**: ✅ **高度可行，强烈推荐立即实施**（95%信心度）

**预期表现**：

| 功能 | JSON成功率 | SQL/模板正确率 | 整体可用率 |
|------|-----------|---------------|-----------|
| 清洗建议 | 85-90% | 80-85% | 75-80% |
| 洞察建议 | 90%+ | 90%+ | 85-90% |

**预期收益**：
- 成本 ↓ 80%
- 速度 ↑ 40%
- 质量 ↓ 10-15%（规则兜底后实际<5%）

**推荐方案**：
- **方案A**：全量切换到Qwen 3B
- **优化建议**：添加Few-shot示例 + 强化promptId约束

---

## 三、AI清洗建议升级到Prompt库

### 3.1 现状问题

**硬编码规则**（`aiService.ts::generateCleaningSuggestions`）：
- 5类规则硬编码（日期、邮箱、去重、缺失值、金额）
- **已废弃未使用**（实际运行用`aiCleaningService.ts`）

**当前AI模式**（`aiCleaningService.ts`）：
- 直接生成SQL，Token消耗高（~1666 tokens）
- 耗时25.4秒

### 3.2 升级方案：三层兼容架构

**架构设计**：
```
Layer 3 (优先): Router模式 → Prompt库模板
    ↓ (如果返回<3条或失败)
Layer 2 (补充): AI直接生成SQL (当前模式)
    ↓ (如果失败)
Layer 1 (兜底): 硬编码规则
```

**核心优势**：
- ✅ 零风险（三层兜底）
- ✅ 渐进式迁移
- ✅ 灵活切换（配置开关）
- ✅ 去重机制
- ✅ 来源追踪（router/ai/rule）

### 3.3 Prompt库设计

**初始模板数量**：5-8个（覆盖80%场景）

**优先级**：

| promptId | 覆盖场景 | 优先级 |
|----------|---------|--------|
| `cleaner-remove-duplicates-v1` | 去重 | 🔴 P0 |
| `cleaner-fill-null-median-v1` | 缺失值填充（数值） | 🔴 P0 |
| `cleaner-fill-null-unknown-v1` | 缺失值填充（文本） | 🔴 P0 |
| `cleaner-standardize-date-v1` | 日期格式标准化 | 🟡 P1 |
| `cleaner-standardize-email-v1` | 邮箱格式标准化 | 🟡 P1 |

**示例模板**：
```typescript
{
  id: 'cleaner-remove-duplicates-v1',
  title: '删除重复行',
  layer: 'L2_EXECUTION',
  sqlTemplate: 'CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT DISTINCT * FROM __TABLE_NAME__',
  inputVariables: [],
  dimensions: [
    {category: 'intent', value: '去重'},
    {category: 'severity', value: 'medium'}
  ]
}
```

### 3.4 预期效果

**正常情况**（Router成功）：
- Router → 4条建议 ✅
- 总耗时：~10秒（↓ 61%）
- Token消耗：~600 tokens（↓ 64%）

**Router部分失败**：
- Router → 2条 + AI补充 → 1条
- 总建议：3条 ✅
- 总耗时：~18秒

**极端情况**（Router + AI均失败）：
- 硬编码规则 → 5条建议 ✅
- 总耗时：<1秒

### 3.5 实施计划

**总工期**：7-10天

```
Day 1-2:   创建清洗Prompt库（5个模板）+ 注册到PromptRegistry
Day 3-4:   实现CleaningRouter（Router Prompt + Inflater）
Day 5-6:   实现三层兼容架构（cleaningSuggestionServiceV2）
Day 7:     集成测试 + 配置开关
Day 8-9:   灰度发布（10%用户启用Router）
Day 10+:   监控数据，逐步提升Router权重
```

---

## 四、下一步行动

### 4.1 即将执行的任务

1. **AI清洗建议升级**（优先级：高）
   - 创建清洗Prompt库
   - 实现三层兼容架构
   - 集成测试

2. **Qwen 3B模型升级**（优先级：中）
   - 配置模型切换
   - 优化Prompt模板
   - 监控指标

### 4.2 成功标准

**AI清洗建议**：
- ✅ Router成功率 > 80%
- ✅ 平均耗时 < 15秒
- ✅ Token消耗 < 800 tokens
- ✅ 用户采纳率 > 60%

**3B模型**：
- ✅ JSON解析成功率 > 85%
- ✅ promptId有效率 > 90%
- ✅ 响应时间 < 2秒
- ✅ 整体质量下降 < 15%

---

## 五、关键决策记录

| 决策 | 理由 | 日期 |
|------|------|------|
| DetailPanel集成到InsightTreeNode | 用户明确要求集成而非独立Focus Mode | 2025-12-27 |
| 采用三层兼容架构 | 零风险渐进式升级，避免一次性切换风险 | 2025-12-27 |
| Prompt库初始5个模板 | MVP最小集，快速验证架构 | 2025-12-27 |
| 全量切换到Qwen 3B | Router架构天然适配3B，风险可控 | 2025-12-27 |

---

## 六、参考文档

- [Qwen 3B可行性评估报告](../../.gemini/antigravity/brain/a111edc0-907e-41d0-ac20-e539e386f638/qwen_3b_feasibility.md)
- [清洗规则Prompt库迁移评估](../../.gemini/antigravity/brain/a111edc0-907e-41d0-ac20-e539e386f638/cleaning_prompt_migration.md)
- [UI设计方案](../../.gemini/antigravity/brain/a111edc0-907e-41d0-ac20-e539e386f638/ui_design_proposal.md)

---

**最后更新**: 2025-12-27 12:07  
**状态**: ✅ DetailPanel集成完成，AI升级任务待执行
