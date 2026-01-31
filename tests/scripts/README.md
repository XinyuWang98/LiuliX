# 类型预过滤测试脚本使用指南

## 概述

提供了两种测试脚本来验证 `ENABLE_TYPE_CONTEXT_PASSING` feature flag 的效果。

---

## 方案1：完整单元测试（推荐用于CI/CD）

**文件**: `tests/unit/typePrefilter.test.ts`

**特点**:
- ✅ 使用真实DuckDB环境
- ✅ 集成Vitest测试框架
- ✅ 测试中英文两种语言
- ✅ 自动生成详细测试报告

**运行方式**:
```bash
npm run test tests/unit/typePrefilter.test.ts
```

**注意事项**:
- 需要启动完整DuckDB实例
- 运行时间较长（约2-5分钟）
- 适合集成到CI/CD流程

---

## 方案2：快速验证脚本（推荐用于开发）

**文件**: `tests/scripts/test-type-prefilter.ts`

**特点**:
- ✅ 无需启动DuckDB
- ✅ 快速执行（<10秒）
- ✅ 模拟类型推断和过滤逻辑
- ✅ 清晰的控制台输出

**运行方式**:
```bash
# 方式1: 使用tsx直接运行
npx tsx tests/scripts/test-type-prefilter.ts

# 方式2: 添加到package.json scripts
npm run test:typefilter
```

**输出示例**:
```
================================================================================
📊 类型预过滤功能测试
================================================================================

📁 测试数据集数量: 5
📋 模板类型约束: 6 个模板

────────────────────────────────────────────────────────────────────────────────
📄 small_sales_100.csv
────────────────────────────────────────────────────────────────────────────────
  列数: 8
  类型分布: VARCHAR, INTEGER, DOUBLE

  ⚙️  Flag OFF: 6 模板
     cleaner-standardize-date-v1, cleaner-remove-duplicates-v1, ...

  ⚙️  Flag ON:  4 模板
     cleaner-remove-duplicates-v1, cleaner-fill-null-median-v1, ...

  ✅ 过滤效果: -2 模板 (33.3%)
     已过滤: cleaner-standardize-date-v1, cleaner-uppercase-v1
```

---

## 测试覆盖的数据集

### 小型数据集（快速测试）
- `small_sales_100.csv` - 100行销售数据
- `small_users_200.csv` - 200行用户数据

### 中型数据集
- `medium_feedback_800.csv` - 800行反馈数据
- `medium_orders_500.csv` - 500行订单数据
- `medium_stocks_1000.csv` - 1000行股票数据

### 大型数据集
- `large_employees_1500.csv` - 1500行员工数据
- `large_sensors_2000.csv` - 2000行传感器数据
- `large_webtraffic_3000.csv` - 3000行网络流量数据

### 超大型数据集（CI测试）
- `xlarge_iot_20k.csv` - 2万行IoT数据
- `xlarge_transactions_5000.csv` - 5000行交易数据
- `xxlarge_financial_80k.csv` - 8万行金融数据
- `xxxlarge_ml_training_150k.csv` - 15万行ML训练数据

**注意**: 默认测试排除了超大数据集（>100MB），可通过修改脚本启用。

---

## 添加新的类型约束

在 `test-type-prefilter.ts` 中更新 `TEMPLATE_TYPE_CONSTRAINTS`:

```typescript
const TEMPLATE_TYPE_CONSTRAINTS: Record<string, string[] | undefined> = {
    'cleaner-standardize-date-v1': ['VARCHAR', 'TEXT'],
    
    // 添加新模板
    'cleaner-your-new-template-v1': ['INTEGER', 'DOUBLE'],
};
```

---

## 验证清单

运行测试后，检查以下指标：

✅ **基础功能**
- [ ] 脚本正常运行无报错
- [ ] 所有数据集都能正确推断列类型
- [ ] Flag OFF时显示所有模板
- [ ] Flag ON时正确过滤不兼容模板

✅ **过滤效果**
- [ ] 至少50%的数据集触发了过滤
- [ ] 平均过滤率 > 20%
- [ ] 没有"异常增加"的情况

✅ **边界情况**
- [ ] 全VARCHAR列的数据集过滤字符串模板
- [ ] 全数值列的数据集过滤字符串模板
- [ ] 混合类型数据集部分过滤

---

## 故障排查

### 问题1: `tsx: command not found`
**解决**: 
```bash
npm install -g tsx
# 或使用 npx
npx tsx tests/scripts/test-type-prefilter.ts
```

### 问题2: 找不到测试数据集
**解决**: 检查 `test_datasets` 目录是否存在
```bash
ls test_datasets/*.csv | wc -l
# 应该输出 18
```

### 问题3: 类型推断不准确
**解决**: 这是简化版本的局限，完整测试请使用 `typePrefilter.test.ts`

---

## 集成到CI/CD

**.github/workflows/test.yml** 示例:
```yaml
- name: Run Type Prefilter Tests
  run: |
    npm run test tests/unit/typePrefilter.test.ts
    npx tsx tests/scripts/test-type-prefilter.ts
```

---

## 相关文档

- [Phase 1 实施计划](../../.gemini/antigravity/brain/.../implementation_plan.md)
- [类型安全架构设计](../../docs/01-架构设计/01-类型安全两层保障架构设计.md)
- [Feature Flags文档](../../docs/04-技术专题/FEATURE_FLAGS_REGISTRY.md)
