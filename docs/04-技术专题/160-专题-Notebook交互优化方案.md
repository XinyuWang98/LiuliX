# 专题 - Notebook/Audit 交互优化方案 (V3 Final)

## 1. 核心理念转变
**从 "Code Execution (Colab)" 转向 "Code Audit (Verification)"**

*   **V1 (旧思路)**：模仿 Kaggle/Colab，强调作为 IDE 的执行流和阅读流。
*   **V2 (新思路)**：**LiuliX 核心是审计**。用户场景主要是"审核结论与代码逻辑的一致性"，而非编写代码。
*   **设计原则**：
    1.  **审计优先**：Input (证据) 与 Output (结论) 应方便比对。
    2.  **左右分栏**：利用宽屏优势，实现 "What (左侧结论)" 与 "How (右侧逻辑)" 的即时对照。
    3.  **代码提纯**：自动清洗重复模版代码（如 Imports），聚焦核心业务逻辑。

---

## 2. 新版布局设计 (Split-Column Audit View)
参考洞察分析模块的"证据-结论"二元结构，在 Report 模块进行增强。

| 区域 | 左侧：结论域 (The Result) | 右侧：证据域 (The Evidence) |
| :--- | :--- | :--- |
| **内容** | **可视化图表**、**关键指标**、**AI 结论摘要** | **Python/SQL 代码块**、**执行日志** |
| **受众** | 业务人员、决策者 | 数据工程师、审计员 |
| **交互** | 查看图表、筛选数据、确认结论 | 审查逻辑、复制代码、编辑修正 |
| **占比** | 50% ~ 60% | 40% ~ 50% (可折叠) |

### 布局优势
*   **无缝比对**：审计员无需上下滚动即可验证 "这段代码生成了这个图"。
*   **视觉降噪**：左侧保持纯净的报告感，右侧保留纯粹的技术细节。

---

## 3. 代码整合与降噪 (Smart Code Integration)

针对由多个 Insight 拼接而成的报告，存在大量重复代码（Boilerplate）的问题。我们需要引入**"代码整合预处理" (Code Consolidation)** 机制。

### 3.1 问题现状
用户从多个独立的"洞察卡片"添加内容到报告，导致 Result 类似：
```python
# Cell 1
import pandas as pd
df = pd.read_csv(...)
...
# Cell 2
import pandas as pd  <-- 重复
df = pd.read_csv(...) <-- 可能重复读取
...
```

### 3.2 优化方案：全局上下文提取 (Context Hoisting)
在生成报告或渲染 Notebook 时，执行预处理：

1.  **提取全局依赖 (Hoisting Imports)**：
    *   扫描所有 Cell，将 `import` 语句提取到报告顶部的 **"Global Setup"** 隐藏块中。
    *   审计员默认无需查看 copy-paste 的 import 代码。
2.  **上下文复用 (Context Reuse)**：
    *   检测重复的数据加载逻辑。如果 Cell 2 依赖 Cell 1 的 `df`，则无需重新加载，而是隐式引用。
    *   *实现难度较高，V1 阶段可先做 Import 清洗*。

### 3.3 视觉降噪
*   **隐藏折叠**：对于必要的 boilerplate（如配置 matplotlib 中文字体），默认自动折叠，仅显示 `[System Config]` 占位符。

---

## 4. 动态编排与逻辑一致性 (Dynamic Orchestration)

用户核心需求：**支持改变结论的展示顺序（DnD）**，同时保持代码逻辑正确且无冗余。

### 4.1 绑定机制：原子化单元 (Atomic Cell)
**如何对应？**
利用 Grid 布局，将 `Output (左)` 和 `Code (右)` 封装在同一个 `ReportCell` 容器中。
*   用户的拖拽对象是 **Row (行)**，而非独立的图表或代码块。
*   物理上的绑定确保了逻辑上的永远对应：**图在哪，生成它的代码就在哪**。

### 4.2 乱序重排策略：依赖解耦 (Dependency Decoupling)
**如何调整顺序后不报错？**
通常 Notebook 依赖严格的 `Top -> Bottom` 执行顺序。为了支持任意 UI 排序，我们采用 **"状态提升 (State Hoisting)"** 策略：

> [!IMPORTANT]
> **核心约束**：Global Setup 必须包含**所有数据处理步骤**（Load + Clean + Transform），只有**纯展示类代码 (plot/print)** 才允许自由拖动。

1.  **全局设置块 (Global Setup Block)** - **固定置顶，不可拖动**
    *   **内容**：Imports、数据加载 (`load_data`)、**数据清洗 (`dropna`, `fillna`)**、**数据转换 (`groupby`, `merge`)**、全局常量。
    *   **作用**：建立共享的上下文环境（Context）。所有后续 Cell 都运行在这个**完全准备好的**环境中。

2.  **局部展示块 (Presentation Cell)** - **自由拖动**
    *   **内容**：绑定逻辑 (`sns.plot`)、特定指标输出 (`print(summary)`)。
    *   **约束**：**只读不写**。它们只读取全局 `df` 进行展示，**禁止修改 `df` 结构**。
    *   **结果**：因为 Cell A 和 Cell B 互不依赖（都只依赖 Global Setup 的最终产物），所以**UI 上互换位置完全不影响代码逻辑**。

### 4.3 智能降噪 (Noise Reduction)
当用户拖入新模块时：
1.  **Diff Check**：检查代码中是否包含 `import` 或 `load_data` 或 **数据变换操作**。
2.  **Auto-Merge**：如果是重复的 import，直接丢弃；如果是**新的数据处理**，自动归并到顶部的 "Global Setup"。
3.  **Local Only**：当前 Cell 只保留最核心的 `plot()` 代码，实现极致降噪。

---

## 5. 结论编辑：数据事实 vs 业务洞察 (Facts vs Insights)

用户核心需求：**数据分析师需要对"冷冰冰的数据结论"进行业务解读和修饰**。

### 5.1 方案选择：Output 侧富文本编辑 (Recommended)
**一定要在 Output 模块（左侧/上层）实现编辑，而不是 Input 代码块。**

*   **理由 1：角色分离**
    *   **Input (Code)**：是工程师的地盘。如果在 python 代码里写 `print("业务增长显著")`，既难写（要转义字符串），又难读。
    *   **Output (UI)**：是分析师的地盘。这里应该是**富文本编辑器 (Markdown/WYSIWYG)**。

*   **理由 2：数据与观点分离**
    *   **Data Fact (硬数据)**：由代码自动生成的 `print()` 结果（如 "斜率=-0.0000"），这部分**不建议直接改**（保持真实性）。
    *   **Business Insight (软观点)**：由分析师添加的解读（如 "这意味着市场趋于饱和"）。

### 5.2 交互设计
在 Left Panel (Result) 中设计分层结构：

1.  **Layer 1: 自动结论 (Auto-Generated)**
    *   样式：灰色引用块 `> Max=1597`。
    *   来源：Python `stdout`。
    *   *不可直接编辑（或作为默认值填充）*。
2.  **Layer 2: 分析师解读 (Analyst Annotation)**
    *   样式：点击即编 (Click-to-Edit) 的 Markdown 区域。
    *   默认提示："点击此处添加业务洞察..."。
    *   **操作**：用户点击后，输入"尽管数值平稳，但考虑到Q4... "。

### 5.3 数据流向
*   **存储**：这个"解读文本"不存回 Python 代码，而是作为 `ReportCell.metadata.annotation` 独立存储在 JSON 中。
*   **导出**：生成 PDF/报告时，优先展示 Annotation，附带 Data Fact。

---

## 6. 多维导出策略 (Export Strategy)

既然我们采用了 "Global Setup + Local Cell" 的内部结构，导出时就需要进行 **"智能编译 (Transpilation/Assembly)"**，根据目标格式组装内容。

> [!IMPORTANT]
> **导出核心逻辑**：`Global Setup (固定) + Presentation Cells (按 UI 顺序)`。
> 导出的 Notebook **假设所有 Presentation Cells 互不依赖**（这也是 State Hoisting 策略的核心约束）。

### 6.1 导出到 Notebook (.ipynb)
**目标**：确保可运行 (Reproducibility)，兼容 **Google Colab** 与 **Standard Jupyter**。
*   **组装逻辑**：
    1.  **Block 0**：写入 Global Setup 代码块（Imports + Data Load + **All Transforms**）。
    2.  **Block 1~N**：按**用户 UI 顺序**依次写入各个 ReportCell 的 `code` 部分。
    3.  **Markdown**：将 ReportCell 的 `annotation` (业务解读) 转换为 `.ipynb` 的 Markdown Cell，插入在代码上方。
*   **结果**：一个标准的、线性的、可执行的 Jupyter Notebook。因为 Global Setup 包含了所有数据准备，后续 Cell 仅做展示，所以无论顺序如何都能跑通。

### 6.2 导出到 PDF / HTML (Static Report)
**目标**：强调阅读体验 (Readability)。
*   **组装逻辑**：
    1.  **所见即所得**：直接渲染当前 UI 的左侧 (Output) 部分。
    2.  **隐藏代码**：默认不渲染右侧代码（或作为附录 Appendices 放在最后）。
    3.  **交互性**：HTML 版可保留 Plotly 等动态图表的交互能力；PDF 版则固化为截图。

### 6.3 导出到 Markdown / Docs
**目标**：便于归档或二次编辑。
*   **组装逻辑**：
    1.  **Header**：Title + Author + Date。
    2.  **Body**：遍历 Cells，提取 `## 标题` (来自 Metadata) + `业务解读` + `![图表]`。
    3.  **Code**：使用 `<details>` 折叠标签包裹代码块，保持文档整洁。

---

## 7. 报告存储与项目管理 (Storage & Project Management)

### 7.1 MVP 阶段策略
> [!NOTE]
> **MVP 阶段仅支持单报告 + LocalStorage**。

*   **存储位置**：浏览器 `localStorage`，Key 为 `liulix_report_draft`。
*   **数据结构**：完整的 `ReportDocument` JSON（包含 Cells、Annotations、Global Setup 等）。
*   **限制**：不支持多报告切换、不支持云端同步。

### 7.2 Future Phase：多报告 & 云同步
*   **项目管理页面**：列出所有历史报告，支持重命名、删除、复制。
*   **后端持久化**：报告存储到数据库（PostgreSQL / SQLite），支持跨设备访问。
*   **协作功能**：多人同时编辑同一份报告（需要冲突解决机制）。

---

## 8. 技术实现可行性分析 (Implementation Feasibility)

**调整策略：MVP 阶段降维打击，优先使用 Regex 脚本，非必要不上 AST/AI。**

| 功能模块 | 实现方式 | V1 方案 (MVP) | V2 方案 (Future) |
| :--- | :--- | :--- | :--- |
| **Grid 布局 & 拖拽** | **纯前端脚本** | React dnd-kit / CSS Grid | - |
| **Import 提取/去重** | **Regex 脚本** | **简单正则匹配** (如 `^import .*`)，快速清洗头部 | AST 精确解析 |
| **上下文合并** | **Regex 脚本** | **忽略复杂重构**，仅做简单的字符串拼接检查 | AI 智能重构变量名 |
| **业务洞察** | **AI (Local)** | **本地模型 (Ollama)** 生成，点击即修 | 云端大模型 |
| **代码解释** | **AI (Local)** | **[新增]** AI 翻译代码为自然语言，辅助小白审计 | - |
| **安全扫描** | **Regex 脚本** | **[精细化]** 见下方 8.3 节 | 沙箱运行检测 |

---

## 9. MVP 关键补全 (MVP Essentials)

针对"新手审计"和"离线安全"场景的专项增强：

### 9.1 辅助审计：小白"翻译机" (AI Code Explainer)
**痛点**：业务人员看不懂 Python 代码，无法审计"右侧代码是否真的生成了左侧图表"。
*   **功能**：在右侧代码块顶部增加 `✨ 解释代码` 按钮。
*   **交互**：点击后，调用 **本地模型** 将代码翻译为人话（如："这段代码读取了 `sales.csv`，并过滤出了 2024 年 Q4 的数据..."）。
*   **价值**：降低审计门槛，让非技术人员也能参与复核。

### 9.2 离线与本地化适配 (Local-First Strategy)
**原则**：所有 AI 功能必须兼容桌面版 (Electron) 和 离线环境。
*   **推理引擎**：优先调用本地 `Ollama` 或 `Gemma-2b` (量化版)，确保断网可用。
*   **降级策略**：若无本地模型，回退到规则引擎（不生成 Insight，只展示原始数据）。

### 9.3 安全防护网 (Security Sandbox)
虽然 Reports 主要是阅读，但考虑到后续可能运行：

*   **静态防御 (Level 1 - MVP)**：
    *   采用**精细化正则**扫描高危函数调用（而非整个模块）：
    ```regex
    os\.system|subprocess\.|eval\(|exec\(|__import__|compile\(
    ```
    *   发现即报警 "⚠️ Potential Malicious Code Detected"，阻止导出或标记高亮。
*   **运行时防御 (Level 2 - Future)**：未来执行必须在 `Pyodide` (WASM) 沙箱中进行，彻底隔离宿主文件系统。

---

## 10. 竞品参考差异

| 特性 | Google Colab | LiuliX Audit (Proposed) |
| :--- | :--- | :--- |
| **布局** | 单列垂直流 (Literate Programming) | **双列对照流 (Audit Verification)** |
| **重点** | 过程与叙事 | **结论与证据的对应** |
| **代码** | 完整展示，强调可复现 | **智能提纯，强调核心逻辑** |

---

## 11. 核心定界：与 "洞察分析" 模块的区别

用户可能会问：*如果报告也能看结果、审代码，那它和洞察分析（Exploration）有什么区别？*

| 维度 | 洞察分析 (Exploration) | 分析报告 (Analysis Report) |
| :--- | :--- | :--- |
| **定位** | **草稿纸 (Scratchpad)** | **正式公文 (Official Document)** |
| **形态** | **流式对话 (Stream)** | **结构化文档 (Structured Artifact)** |
| **逻辑** | 时间序 (Chronological) | 叙事序 (Narrative) |
| **代码** | 碎片化，包含大量试错过程 | **提纯后**，去重、清洗、逻辑连贯 |
| **操作** | 生成、废弃、重试 | 编排、修饰、签字、导出 |

**交互上的关键区分点：**
1.  **不可变 vs 可编辑**：洞察模块是不可变的时间流（探索日志）；报告模块是可编排的叙事流（支持拖拽重排、删除、修饰）。
2.  **视角差异**：洞察模块是 "探索过程"；报告模块是 "最终交付物"。
3.  **操作重心**：
    *   洞察模块：推荐卡片点击 → 持续探索。
    *   报告模块：签字/导出/审计 → 定稿归档。

---

## 12. 实施路线图 (Revised Roadmap)

### Phase 1: 布局与脚本清洗 (Grid & Regex)
*   **Layout**: 实现左右分栏（Grid）& 拖拽（dnd-kit）。
*   **Component Split**: 将 `ReportCell` 拆分为 `CellResult` (左) 和 `CellCode` (右)。
*   **Cleaner**: Regex 规则清洗 `import` 和 `plt` 设置废话。
*   **Storage**: LocalStorage 单报告持久化。

### Phase 2: 审计辅助 (Audit Aids)
*   **Explainer**: 集成 Ollama 接口，实现"一键解释代码"。
*   **Scanner**: 上线精细化静态代码安全扫描。
*   **Annotation**: 实现左侧结论区的富文本编辑。

### Phase 3: 多报告与云同步 (Project Management)
*   **Multi-Report**: 支持创建/切换/删除多份报告。
*   **Backend Sync**: 报告存储到后端数据库。
*   **Audit Trail**: 记录修改历史（谁、何时、改了什么），支持版本回溯。

### Phase 4: 未来执行能力 (Future Execution)
*   **Kernel Integration**: 当升级为可执行 Notebook 时，左右布局依然有效（右侧编辑，左侧实时刷新预览）。
*   **Pyodide Sandbox**: 运行时安全隔离。

---

## 13. Phase 1 详细实施计划 (Agent 执行手册)

> [!NOTE]
> 本节为 **Agent 执行手册**，包含完整的代码复用审计、全局规则合规性检查、类型定义变更和文件变更清单。

### 13.1 代码复用审计

| 现有组件 | 路径 | 可复用场景 |
|----------|------|------------|
| **CodeBlock** | `src/components/common/CodeBlock/CodeBlock.tsx` | ✅ 右侧代码域直接复用（支持 Prism 高亮、复制按钮） |
| **ChartImage** | `src/components/insights/ChartImage.tsx` | ✅ 左侧图表展示直接复用（支持 Base64→BlobURL、全屏预览、下载） |
| **LiuliGlass** | `src/components/common/liulix/LiuliGlass.tsx` | ✅ 容器样式复用 |
| **CSS 变量** | `src/styles/variables.css` | ✅ 必须使用，禁止硬编码颜色/尺寸 |
| **logger** | `src/utils/logger.ts` | ✅ 必须使用，禁止裸 console.log |
| **i18n** | `src/contexts/I18nContext.tsx` | ✅ 所有用户可见文案必须走 t('key') |

### 13.2 全局规则合规审计

| 规则 | 检查项 | 合规要求 |
|------|--------|----------|
| **铁律1** | CSS 变量强制化 | 所有颜色/尺寸使用 `var(--xxx)` |
| **铁律2** | i18n 强制化 | 新增文案必须同时更新 `locales/zh-CN/*.ts` 和 `src/types/i18n.ts` |
| **铁律3** | 中文注释 | 所有函数/组件必须中文注释 |
| **铁律5** | 禁止内联样式 | 禁止 `style={{ color: 'red' }}`，使用 className |
| **铁律11** | 文件行数上限 | 所有文件 ≤ 500 行（否则拆分） |
| **铁律15** | logger 规范 | 使用 `logger.log('报告', '...')` 格式 |
| **铁律17** | 代码复用 | 优先复用上表中的组件，禁止重复造轮子 |

### 13.3 类型定义修改

**文件**: `src/types/report.ts`

```diff
 export interface ReportCell {
     id: string;
     code: string;
     rawCode?: string;
     language: 'sql' | 'python';
+
+    /** ✅ 新增：去除 import 后的展示代码 */
+    presentationCode?: string;
+
     output: {
         chartImage?: string;
         summary?: string;
         error?: string;
+        /** ✅ 新增：Python stdout 输出（用于左侧显示） */
+        stdout?: string;
     };
+
+    /** ✅ 新增：元数据 */
+    metadata?: {
+        /** 用户手写的业务解读 */
+        annotation?: string;
+        /** Cell 标题 */
+        title?: string;
+    };
+
     depth: number;
     parentId?: string;
     auditStatus: AuditStatus;
     auditNote?: string;
 }

 export interface ReportDocument {
     id: string;
     title: string;
     cells: ReportCell[];
     isSigned: boolean;
     signedBy?: string;
     signedAt?: number;
+
+    /** ✅ 新增：全局设置块（合并的 import 语句） */
+    globalSetup?: string;
 }
```

### 13.4 新增工具函数

**文件**: `src/utils/codeCleanser.ts` [NEW]

```typescript
/**
 * 代码清洗工具
 * MVP 规则：只提取以 "import " 或 "from " 开头的行
 */

export interface CleanseResult {
    /** 所有 import 语句（去重） */
    globalSetup: string;
    /** 去除 import 后的代码 */
    presentationCode: string;
}

/**
 * 从单个代码块中提取 import 语句
 */
export function cleanseCode(rawCode: string): CleanseResult {
    const lines = rawCode.split('\n');
    const imports: string[] = [];
    const others: string[] = [];
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            imports.push(line);
        } else {
            others.push(line);
        }
    }
    
    return {
        globalSetup: imports.join('\n'),
        presentationCode: others.join('\n').trim()
    };
}

/**
 * 合并多个代码块的 import 语句（去重排序）
 */
export function mergeGlobalSetup(codes: string[]): string {
    const importSet = new Set<string>();
    
    for (const code of codes) {
        const { globalSetup } = cleanseCode(code);
        globalSetup.split('\n').forEach(line => {
            if (line.trim()) importSet.add(line.trim());
        });
    }
    
    // 按字母排序，import 在前，from 在后
    return Array.from(importSet)
        .sort((a, b) => {
            const aIsFrom = a.startsWith('from');
            const bIsFrom = b.startsWith('from');
            if (aIsFrom !== bIsFrom) return aIsFrom ? 1 : -1;
            return a.localeCompare(b);
        })
        .join('\n');
}
```

### 13.5 组件拆分

#### [NEW] `src/components/report/CellResult.tsx`

**职责**: 渲染左侧结论域

```tsx
import { ChartImage } from '../insights/ChartImage';
import { useI18n } from '@/contexts/I18nContext';
import { ReportCell } from '@/types/report';
import './CellResult.css';

interface CellResultProps {
    cell: ReportCell;
    onAnnotationChange: (annotation: string) => void;
    isLocked: boolean;
}

export function CellResult({ cell, onAnnotationChange, isLocked }: CellResultProps) {
    const { t } = useI18n();
    
    return (
        <div className="cell-result">
            {/* 图表区 */}
            {cell.output.chartImage && (
                <ChartImage 
                    src={cell.output.chartImage}
                    alt={cell.metadata?.title || t('report.cell.defaultTitle')}
                    variant="report"
                />
            )}
            
            {/* AI 摘要 */}
            {cell.output.summary && (
                <div className="cell-result-summary">
                    <blockquote>{cell.output.summary}</blockquote>
                </div>
            )}
            
            {/* stdout 输出 */}
            {cell.output.stdout && (
                <pre className="cell-result-stdout">{cell.output.stdout}</pre>
            )}
            
            {/* 用户注解（可编辑） */}
            <div className="cell-result-annotation">
                {isLocked ? (
                    <p>{cell.metadata?.annotation || ''}</p>
                ) : (
                    <textarea
                        value={cell.metadata?.annotation || ''}
                        onChange={e => onAnnotationChange(e.target.value)}
                        placeholder={t('report.annotation.placeholder')}
                    />
                )}
            </div>
        </div>
    );
}
```

#### [NEW] `src/components/report/CellCode.tsx`

**职责**: 渲染右侧代码域

```tsx
import { CodeBlock } from '../common/CodeBlock/CodeBlock';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { ReportCell } from '@/types/report';
import './CellCode.css';

interface CellCodeProps {
    cell: ReportCell;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function CellCode({ cell, isCollapsed, onToggleCollapse }: CellCodeProps) {
    const { t } = useI18n();
    const code = cell.presentationCode || cell.code;
    
    return (
        <div className="cell-code">
            <div className="cell-code-header" onClick={onToggleCollapse}>
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                <span>{t('report.code.title')}</span>
            </div>
            
            {!isCollapsed && (
                <CodeBlock
                    code={code}
                    language={cell.language}
                    copyable={true}
                    formatted={false}
                />
            )}
        </div>
    );
}
```

### 13.6 ReportContext 修改

**文件**: `src/contexts/ReportContext.tsx`

在 `useEffect` 同步 records → document 时，调用 `cleanseCode` 处理：

```typescript
import { cleanseCode, mergeGlobalSetup } from '@/utils/codeCleanser';

// 在 useEffect 中：
const cells: ReportCell[] = records
    .filter(r => r.type === 'insightChain')
    .map(record => {
        const rawCode = record.metadata?.code || '';
        const { presentationCode } = cleanseCode(rawCode);
        
        return {
            id: record.id,
            code: rawCode,
            presentationCode,  // ✅ 新增
            // ... 其他字段
        };
    });

// 合并 globalSetup
const globalSetup = mergeGlobalSetup(cells.map(c => c.code));

setDocument(prev => ({
    ...prev,
    cells,
    globalSetup,  // ✅ 新增
}));
```

### 13.7 CSS 样式（使用变量）

**文件**: `src/components/report/ReportNotebook.css` 新增：

```css
/* 左右分栏布局 */
.report-cell-row {
    display: grid;
    grid-template-columns: 55% 45%;
    gap: var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    padding: var(--spacing-m) 0;
}

/* 响应式：小屏幕切换为单列 */
@media (max-width: 1024px) {
    .report-cell-row {
        grid-template-columns: 1fr;
    }
}

/* Global Setup 区域 */
.global-setup-block {
    background: var(--surface-muted);
    border-radius: var(--radius-m);
    padding: var(--spacing-s) var(--spacing-m);
    margin-bottom: var(--spacing-m);
}

.global-setup-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    cursor: pointer;
    user-select: none;
}

.global-setup-content {
    margin-top: var(--spacing-s);
    font-family: var(--font-mono);
    font-size: var(--font-size-s);
    white-space: pre-wrap;
}
```

### 13.8 i18n 新增 Keys

**文件**: `src/locales/zh-CN/analysis.ts`

```typescript
report: {
    // ... 现有 keys
    annotation: {
        placeholder: '点击此处添加业务洞察...',
    },
    code: {
        title: '代码',
    },
    cell: {
        defaultTitle: '分析结果',
    },
    globalSetup: {
        title: '全局设置',
        collapsed: '（点击展开）',
    },
}
```

**文件**: `src/types/i18n.ts` 同步更新类型定义。

### 13.9 文件变更清单

| 操作 | 文件路径 | 说明 | 预估行数 |
|------|----------|------|----------|
| MODIFY | `src/types/report.ts` | 新增 `globalSetup`, `presentationCode`, `metadata` 字段 | +20 |
| NEW | `src/utils/codeCleanser.ts` | import 提取与合并工具 | ~60 |
| NEW | `src/components/report/CellResult.tsx` | 左侧结论域组件 | ~80 |
| NEW | `src/components/report/CellResult.css` | 结论域样式 | ~50 |
| NEW | `src/components/report/CellCode.tsx` | 右侧代码域组件 | ~50 |
| NEW | `src/components/report/CellCode.css` | 代码域样式 | ~40 |
| MODIFY | `src/components/report/ReportNotebook.tsx` | 重构为 Grid 左右分栏 | ~+50 |
| MODIFY | `src/components/report/ReportNotebook.css` | 新增分栏样式 | +30 |
| MODIFY | `src/contexts/ReportContext.tsx` | 调用 cleanseCode 处理代码 | +15 |
| MODIFY | `src/locales/zh-CN/analysis.ts` | 新增 i18n keys | +10 |
| MODIFY | `src/types/i18n.ts` | 同步 i18n 类型 | +10 |

**总计**: 新增 ~280 行，修改 ~125 行

### 13.10 验证计划

```bash
# 1. TypeScript 编译
npm run build

# 2. 手动验证
# - 打开 http://localhost:5173/workbench
# - 采纳一条洞察到报告
# - 滚动到"分析报告"模块
# - 检查：
#   [ ] 左右分栏布局正确显示
#   [ ] 左侧显示图片和 AI 摘要
#   [ ] 右侧显示代码（不含 import）
#   [ ] 顶部 Global Setup 可折叠
#   [ ] 用户可编辑左侧注解区
```

### 13.11 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Regex 误杀有用的 import 注释 | 低 | MVP 接受，后续用 AST 改进 |
| 代码块过长导致右侧溢出 | 中 | 添加 `max-height` + 滚动条 |
| 图片 Base64 过大导致卡顿 | 低 | 复用 ChartImage 的 Blob URL 优化 |
| i18n 类型不同步 | 高 | 必须同时更新 locales 和 types |

### 13.12 执行进度追踪 (2026-01-10 更新)

- [x] **1. 基础设施**
    - [x] 类型定义修改 (`ReportDocument`, `ReportCell`)
    - [x] 代码清洗工具 (`codeCleanser.ts`)
    - [x] i18n 中文适配 (`zh-CN/analysis.ts`)
    - [ ] i18n 英文适配 (`en-US/index.ts`) [TODO]
- [x] **2. 组件拆分**
    - [x] 左侧结论域组件 (`CellResult.tsx`)
    - [x] 右侧代码域组件 (`CellCode.tsx`)
    - [x] 相关 CSS 样式 (`.css`)
- [ ] **3. 核心重构**
    - [ ] ReportNotebook 布局重构 (Grid) [TODO]
    - [ ] ReportContext 状态转换集成 [TODO]
