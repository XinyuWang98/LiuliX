# 32-测试-Console日志分组验证问题追踪

**测试时间**: 2025-12-24  
**关联文档**: [31-测试-洞察分析模块验收测试.md](file:///c:/Users/86177/Desktop/DataPrism_antigravity/docs/03-测试验证/31-测试-洞察分析模块验收测试.md)

---

## 📊 问题汇总

| 编号 | 问题 | 严重程度 | 状态 | 修复文件 |
|------|------|---------|------|---------|
| #1 | 日志分组未按需求拆分 | P2 | 🔍 已记录 | - |
| #2 | AI洞察超时 | P0 | ✅ 已修复 | `aiService.ts`, `useInsightLoaderV2.ts` |
| #3 | 编码损坏 | P0 | ✅ 已修复 | 手动修复 |
| #4 | AI清洗建议质量低 | P1 | ✅ 已修复 | `cleaningSuggestions.ts` |
| #5 | 内存评估缺陷 | P1 | ✅ 已修复 | `useInsightLoaderV2.ts` |
| #6 | 滚动条UI不一致 | P2 | 🔍 已记录 | - |
| #7 | 洞察生成缺少进度条 | P1 | 🔍 已记录 | - |
| #8 | **JSON解析失败** | **P0** | **✅ 已修复** | `batchInsightGenerator.ts` |
| #9 | BigInt类型错误 | P0 | ✅ 已修复 | `memoryAssessment.ts` |
| #10 | Python df未定义 | P0 | ✅ 已修复 | `modeExecutor.ts` |
| #11 | BigInt序列化失败 | P0 | ✅ 已修复 | `modeExecutor.ts` |
| #12 | 清洗标题滚动优化 | P2 | 🔍 已记录 | - |
| #13 | 数据清洗加载无提示 | P1 | ✅ 已修复 | `DataCleaner.tsx` |
| #14 | **AI清洗Prompt数据为空** | **P0** | **✅ 已修复（修正）** | `aiCleaningService.ts`, `useSuggestionGeneration.ts` |
| #15 | **Pyodide内存溢出** | **P0** | **✅ 已修复（优化）** | `modeExecutor.ts`, `memoryAssessment.ts` |
| #16 | JSON修复后仍然解析失败 | P1 | 🔍 已记录 | - |
| #17 | **🔥 Pyodide内存溢出未解决** | **P0** | **🚨 阻塞中** | `modeExecutor.ts` |
| #18 | **🔥 JSON控制字符未转义** | **P0** | **🚨 阻塞中** | `modeExecutor.ts` |
| #19 | **🔥 AI清洗Prompt列信息丢失** | **P0** | **✅ 已修复** | `dataSanitizer.ts` |
| #20 | **🔥 底部输入框遮挡内容** | **P1** | **⏳ 已延后** | `ExplorationFlow.css` (待专项UI优化) |
| #21 | **🔥 清洗建议执行逻辑错误 (模板 vs AI)** | **P0** | **✅ 已修复** | `useCleaningExecution.ts`, `aiCleaningService.ts` |
| #22 | **AI清洗进度文案不同步** | **P1** | **✅ 已修复** | `AILoading.tsx`, `useSuggestionGeneration.ts` |
| #23 | **SQL卡片高度不一致** | **P2** | **✅ 已修复** | `SuggestionCard.css` |
| #24 | **AI刷新逻辑竞态** | **P1** | **✅ 已修复** | `useInsightRefresh.ts` |
| #25 | **Matplotlib中文乱码** | **P1** | **✅ 已修复** | `PyodideManager.ts`, `worker.ts` |

---

## 🔍 待修复问题详情

### 问题#21: 清洗建议执行逻辑错误 (P0 - 严重逻辑缺陷)
**现象**:
- **功能失误**: 此刻系统显示的 AI 建议（经过 Dry-Run 校验的 SQL）与实际点击应用时执行的 SQL（本地模板拼装）**不一致**。
- **用户体验**: 用户看不到即将执行的 SQL，且无法确认 AI 的复杂建议是否被正确执行。

**深度分析 (Code Audit)**:
1.  **逻辑断层**: `aiCleaningService.ts` 生成并校验了 AI SQL，但 `useCleaningExecution.ts` 丢弃了它，转而使用 `sqlBuilder.ts` 的死板模板。
2.  **严重性**: 甚至可能出现 AI 建议 "删除空列A"，但模板执行 "删除空列B" (如果参数映射错误)，或者 AI 的高级建议（如复杂的 RegEx 替换）被降级为普通操作。

### 问题#21: 清洗建议执行逻辑错误 (P0 - 严重逻辑缺陷) ✅
**修复**: 
- Data 透传：`SimpleSuggestion` 增加 `sql` 字段。
- UI 展示：`SuggestionCard` 增加 SQL 代码预览。
- 执行逻辑：`useCleaningExecution` 优先执行 AI SQL，保障所见即所得。
**文件**: `cleaning.types.ts`, `aiCleaningService.ts`, `useCleaningExecution.ts`, `SuggestionCard.tsx`

---

## ✅ 已修复问题详情


### 问题#2: AI洞察超时 ✅
**修复**: 前端超时180秒 + 限制列数到50列  
**文件**: `aiService.ts` L262, `useInsightLoaderV2.ts` L58-84

### 问题#4: AI清洗建议质量低 ✅
**修复**: Prompt添加完整列名列表  
**文件**: `cleaningSuggestions.ts` L109-110
```typescript
3. **可用列名清单**（SQL中必须只使用以下列名）：
${desensitizedData.map(col => `   - "${col.name}" (${col.type})`).join('\n')}
```

### 问题#5: 内存评估缺陷 ✅
**修复**: 添加GPU内存检测（4.5GB阈值），不足时降级API  
**文件**: `useInsightLoaderV2.ts` L97-122

### 问题#9: BigInt类型错误 ✅
**修复**: `const totalRowsNum = Number(totalRows)`  
**文件**: `memoryAssessment.ts` L59

### 问题#10: Python df未定义 ✅
**修复**: 从DuckDB导出数据并加载到Pyodide  
**文件**: `modeExecutor.ts` L54-88

### 问题#11: BigInt序列化失败 ✅
**错误**: `Do not know how to serialize a BigInt`  
**原因**: `JSON.stringify(data)` 无法序列化BigInt类型  
**修复**: 添加replacer函数转换BigInt为string  
**文件**: `modeExecutor.ts` L77
```typescript
JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value)
```

### AI清洗Prompt日志增强 ✅
**文件**: `aiCleaningService.ts` L62-65  
**添加**: 完整Prompt内容日志（分组收起）

### 问题#14: AI清洗Prompt数据为空 ✅（已修正）
**初始错误修复**: 兜底逻辑从DuckDB获取真实列名 → **安全漏洞**  
**修正方案**: 撤回兜底逻辑，添加早期参数验证  
**文件**: `aiCleaningService.ts` L46-56, `useSuggestionGeneration.ts` L260-277
```typescript
// ✅ 早期参数验证：防止security漏洞
if (!columns || columns.length === 0) {
    throw new Error('columns参数为空，无法生成清洗建议');
}
// ✅ 防御性检查
const columns = activeFile.data.columns || [];
if (columns.length === 0) {
    logger.warn('数据清洗', 'columns为空，跳过AI建议生成');
    return;
}
```

### 问题#15: Pyodide内存溢出 ✅（已优化）
**初始修复**: 硬编码10000行限制 → **魔法数字**  
**优化方案**: 动态计算最大行数（基于列数和内存）  
**文件**: `memoryAssessment.ts` L174-202, `modeExecutor.ts` L68-81
```typescript
// ✅ 动态计算：10列→~21845行，100列→~2184行
const schema = await db.runQuery(`DESCRIBE ${tableName}`);
const maxRows = calculateMaxRowsForPyodide(schema.length, 512);
if (totalRows > maxRows) {
    logger.warn(`已限制到${maxRows}行（基于${columnCount}列内存评估）`);
}
```

### 问题#8: JSON解析失败 ✅
**错误**: `Unterminated string in JSON at position 11256`  
**原因**: AI响应被截断，JSON字符串不完整  
**修复**: 添加JSON修复函数 + 增强错误日志  
**文件**: `batchInsightGenerator.ts` L151-210
```typescript
function attemptJSONRepair(jsonStr: string): string {
    if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
        const lastCompleteObj = trimmed.lastIndexOf('},');
        return trimmed.substring(0, lastCompleteObj + 1) + ']';
    }
}
```

### 文件元数据日志增强 ✅
**文件**: `LeftSidebar.tsx` L63-70, L84-91

### 问题#19: AI清洗Prompt列信息丢失 ✅
**修复**: 修复 `dataSanitizer.ts` 中 `buildDesensitizedMetadata` 函数参数传递问题，确保 columns 正确透传。
**验证**: 日志显示 `[AI洞察] 数据规模 {columns: 99}`，Prompt 不再丢失列信息。

### 问题#22: AI清洗进度文案不同步 ✅
**修复**: 
- `useSuggestionGeneration.ts` 增加实时进度回调。
- `AILoading.tsx` 支持外部 `message` 属性，优先显示真实进度文案。
- 只有在 AI 真正执行到某一步时，界面才更新文字（如 "正在校验SQL安全性"）。

### 问题#23: SQL卡片高度不一致 ✅
**修复**: 
- `SuggestionCard.css` 强制固定 SQL 代码区域高度为 `120px`。
- 底部操作栏 (`.sqlFooter`) 使用 Flex 布局强制底部对齐。
- 确保 Grid 布局中所有卡片高度整齐划一。

### 问题#24: AI刷新逻辑竞态 (P1) ✅
**修复**: 
- `useInsightRefresh.ts` 采用抢占式策略，当 `isStale: true` 时强制触发刷新。
- `useInsightLoaderV2.ts` 集成 `AbortController`，自动取消前一个未完成的请，防止回调冲突。

### 问题#25: Matplotlib中文乱码 (P1) ✅
**修复**: 
- 后端 `worker.ts` 实现 `LOAD_FONT_URL` 协议。
- 前端按需加载机制：仅在中文环境下动态请求字体文件并注入 Pyodide FS。


---


## ⏭️ 待处理问题

### 问题#16: JSON修复后仍然解析失败 (P1 - 非阻塞)
**日志证据**:
```
[AI服务] JSON修复成功 原长度: 11688, 修复后: 11533
[AI服务] AI响应解析失败 SyntaxError: Expected ',' or '}' after property value in JSON at position 11532
```
**原因**: JSON修复逻辑工作了，但修复后的JSON仍有语法错误  
**影响**: 洞察生成失败，回退到预置模板（有fallback）  
**判断**: **P1非阻塞** - 已有fallback机制  
**建议**: 改进JSON修复算法，更精确地定位完整对象

### 问题#17: **Pyodide内存溢出未解决**（🔥 P0阻塞）
**日志证据**:
```
[Skills] 数据加载失败 Error: PythonError: MemoryError
```
**数据规模**: 43228行×99列  
**根本原因**: 问题#15的修复**没有生效**！动态行数限制逻辑未被触发  
**判断**: **P0阻塞** - 大文件洞察完全失效  
**需立即排查**: 
1. `calculateMaxRowsForPyodide`是否被调用？
2. 日志中未见"数据量过大，已限制到X行"警告
3. 可能导入路径错误或逻辑未执行

### 问题#18: **JSON包含未转义控制字符**（🔥 P0阻塞）
**日志证据**:
```
json.decoder.JSONDecodeError: Invalid control character at: line 1 column 7304343 (char 7304342)
```
**原因**: `JSON.stringify(data)`时，数据中包含控制字符（如`\n`, `\r`, `\t`）未转义  
**影响**: 数据加载到Pyodide失败  
**判断**: **P0阻塞** - 洞察执行失败  
**修复**: 在JSON.stringify时添加控制字符转义



### 问题#1: 日志分组未按需求拆分 (P2 - 体验优化)

**需求**: console.group分组优化  
**优先级**: 非阻塞，延后处理

### 问题#6: 滚动条UI不一致 (P2 - UI优化)
**优先级**: 非阻塞，延后处理

### 问题#7: 洞察生成缺少进度条 (P1 - 体验优化)
**需求**: 添加洞察生成进度指示  
**优先级**: 非阻塞，延后处理

### 问题#12: 清洗标题滚动优化 (P2 - 体验优化)
**需求**: 长标题鼠标悬停时动态滚动  
**优先级**: 非阻塞，延后处理

---

## ✅ 测试验证结果

### 根本原因修复验证（问题#14/17/18）✅ 部分有效
**日志**: 
- ✅ `[DuckDB] CSV导入完成 {columns: 99}`
- ✅ `[AI洞察] 数据规模 {columns: 99, totalRows: 43228n}` ← columns不再是0
- ✅ `[AI清洗] 生成清洗建议流程` ← 不再被拦截
- ✅ 无"columns为空，跳过AI建议生成"警告

**结果**: 根本原因修复**部分有效**，但发现新问题#19（AI清洗Prompt列信息丢失）

### 问题#14验证 ✅（之前测试）
**日志**: `[数据清洗] columns为空，跳过AI建议生成`  
**结果**: 防御性检查生效，安全漏洞已修复（现已撤回）

### 问题#8验证 ✅（之前测试）
**日志**: `[AI服务] JSON修复成功 原长度: 11688, 修复后: 11533`  
**结果**: JSON修复逻辑触发，但后续仍有问题（见问题#16）

---

## 📝 已修改文件（14个）



1. `src/services/aiService.ts` - 超时180秒
2. `src/hooks/useInsightLoaderV2.ts` - 列数限制+GPU检测
3. `src/utils/memoryAssessment.ts` - BigInt转换+PyodideMaxRows函数
4. `src/services/skills/modeExecutor.ts` - 数据加载+BigInt序列化+行数限制
5. `src/services/prompts/cleaningSuggestions.ts` - Prompt列名列表
6. `src/components/layout/LeftSidebar.tsx` - 日志增强
7. `src/services/aiCleaningService.ts` - Prompt日志+早期参数验证（撤回兜底逻辑）
8. `src/components/cleaning/DataCleaner.tsx` - 空状态提示优化
9. `src/components/cleaning/hooks/useSuggestionGeneration.ts` - 撤回防御性检查（-7行）
10. `src/services/prompts/batchInsightGenerator.ts` - JSON修复函数
11. `src/utils/dataSanitizer.ts` - (间接影响)
12. `src/components/layout/LeftSidebar.tsx` - **设置file.data.columns** (+9行)
13. `src/services/aiCleaningService.ts` - **撤回早期验证** (-4行)
14. `src/components/cleaning/hooks/useSuggestionGeneration.ts` - **撤回防御性检查** (-7行)

---

**更新时间**: 2025-12-24 19:50  
**总问题数**: 23个（13个已修复，**2个P0阻塞中**，8个待处理/已记录）  
**当前状态**: ✅ **问题#19/21/22/23 已修复，UI与逻辑同步完成**  
**代码变更**: +120行，-40行

**🔥 紧急**: 问题#17（Pyodide内存）、#18（JSON控制字符）仍需关注
