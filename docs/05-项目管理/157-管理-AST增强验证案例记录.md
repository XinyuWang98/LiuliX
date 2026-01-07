# AST增强验证案例：Skills执行失败场景

**记录日期**: 2026-01-04  
**用途**: 作为用户协助AST增强功能的验证案例  
**状态**: 待验证

---

## 案例背景

在housing.csv数据集的洞察分析过程中，发现Skills执行失败的典型场景，这些场景可以用来验证：
1. 用户是否同意协助改进AI代码质量
2. AST增强规则是否能有效防护这些错误
3. 用户反馈对AST规则优化的价值

---

## 错误场景1：空DataFrame导致绘图失败

### 错误信息

```
[17:28:37.449] [Skills] full_mode执行失败
ValueError: 数据索引越界（可能是过滤后结果为空）: 
index 0 is out of bounds for axis 0 with size 0
```

### 完整堆栈

```python
File "/lib/python3.12/site-packages/pandas/plotting/_matplotlib/core.py", line 1966
s_edge = self.ax_pos[0] - 0.25 + self.lim_offset
         ~~~~~~~~~~~^^^
IndexError: index 0 is out of bounds for axis 0 with size 0
```

### 执行上下文

- **数据集**: housing.csv (20640行)
- **洞察编号**: 洞察4
- **执行模式**: full_mode
- **失败原因**: 数据过滤后DataFrame变为空，但代码未检查直接绘图

### AST增强规则需求

**规则名称**: `empty_dataframe_check`

**规则描述**: 在执行绘图操作前，检查DataFrame是否为空

**实现示例**:

```python
# AST转换前
df_filtered = df[df['price'] > 1000000]
df_filtered.plot(kind='bar')

# AST转换后
df_filtered = df[df['price'] > 1000000]
if df_filtered.empty:
    raise ValueError("过滤后数据为空，无法绘图")
df_filtered.plot(kind='bar')
```

**防护场景**:
- ✅ `df.plot()` 前检查
- ✅ `df.hist()` 前检查
- ✅ `df.groupby().plot()` 前检查
- ✅ 访问 `df.iloc[0]` 前检查

---

## 错误场景2：无效列名引用

### 错误信息

```
[17:28:37.450] [列名校验] 检测到无效列名
[17:28:37.450] [AI洞察] 跳过无效列名的洞察: 分析房价随时间的趋势变化
```

### 执行上下文

- **数据集**: housing.csv
- **洞察编号**: 洞察5
- **失败原因**: AI生成的代码引用了不存在的列名

### 可能原因

1. **AI幻觉**: 生成了数据集中不存在的列名
2. **列名大小写**: 实际列名与AI生成的大小写不一致
3. **特殊字符**: 列名包含特殊字符未正确转义

### 列名校验增强需求

**当前问题**: 列名校验在执行前进行，但AI仍可能生成无效列名

**改进方案**:

```typescript
// 1. Prompt层面：明确列出可用列名
const availableColumns = columns.map(c => c.name).join(', ');
const prompt = `
数据集可用列（必须从中选择）：
${availableColumns}

严格要求：
- 只能使用上述列名
- 列名大小写必须完全匹配
- 不允许创造新列名
`;

// 2. 执行前验证：严格检查
const invalidColumns = extractColumnsFromCode(code).filter(
    col => !availableColumns.includes(col)
);
if (invalidColumns.length > 0) {
    throw new Error(`无效列名: ${invalidColumns.join(', ')}`);
}

// 3. AST增强：运行时防护
try:
    result = df['invalid_column']
except KeyError as e:
    raise ValueError(f"列'{e.args[0]}'不存在，可用列: {list(df.columns)}")
```

---

## 用户协助验证流程设计

### Phase 1：用户同意收集

**触发时机**: Skills执行失败时

**UI提示**:
```
⚠️ 代码执行失败

原因：数据过滤后为空，无法绘图

🤝 帮助我们改进
您是否同意将此失败案例用于改进AI代码质量？
- 我们将收集：执行的代码、错误信息、数据集结构
- 我们不会收集：您的原始数据内容
- 用途：优化AST增强规则，防止类似错误

[ 同意并帮助改进 ]  [ 不同意 ]  [ 总是同意 ]
```

### Phase 2：案例收集

**收集内容**:
```typescript
interface ErrorCase {
    timestamp: number;
    errorType: 'IndexError' | 'KeyError' | 'ValueError';
    errorMessage: string;
    code: string;  // AI生成的代码
    datasetSchema: {  // 仅结构，不含数据
        columns: string[];
        dtypes: string[];
        shape: [number, number];
    };
    userConsent: boolean;
}
```

### Phase 3：规则优化

1. **分析失败案例**
   - 提取共性模式
   - 识别高频错误
   - 设计防护规则

2. **更新AST增强器**
   - 添加新规则到 `liulix-code-enhancer`
   - 编写单元测试
   - 验证覆盖率

3. **反馈用户**
   - 通知用户新规则已上线
   - 展示改进效果（X%错误已防护）
   - 感谢用户贡献

---

## 预期验证结果

### 成功指标

1. **用户参与率**
   - 目标：>30%用户同意协助
   - 数据来源：错误提示的用户响应率

2. **错误防护率**
   - 目标：新规则上线后，同类错误减少80%
   - 数据来源：对比前后错误发生频率

3. **用户满意度**
   - 目标：NPS > 8
   - 数据来源：用户反馈与评分

### 风险控制

1. **隐私保护**
   - ✅ 仅收集代码和schema，不收集数据
   - ✅ 用户明确同意后才收集
   - ✅ 本地存储，不上传服务器

2. **功能降级**
   - ✅ 用户拒绝不影响功能使用
   - ✅ 提供"总是同意"选项减少打扰
   - ✅ 错误仍会正常显示和处理

---

## 后续行动计划

### 立即记录（已完成）
- [x] 记录错误场景详情
- [x] 分析AST增强需求
- [x] 设计用户协助流程

### 短期实施（1-2周）
- [ ] 实现错误提示UI组件
- [ ] 完善用户同意管理
- [ ] 建立案例收集机制

### 中期优化（1个月）
- [ ] 分析收集的案例
- [ ] 开发新的AST规则
- [ ] 上线并验证效果

### 长期迭代（持续）
- [ ] 社区贡献机制
- [ ] 自动化规则生成
- [ ] 成效报告发布

---

**相关文档**:
- [09-专题-AI代码质量自动化优化方案](../04-技术专题/02-Prompt库/09-专题-AI代码质量自动化优化方案.md)
- [08-专题-AI代码质量提升方案](../04-技术专题/02-Prompt库/08-专题-Prompt库AI代码质量提升方案.md)

**关联Issue**: #AST-Enhancement #User-Feedback #Error-Prevention
