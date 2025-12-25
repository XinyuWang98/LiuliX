# 11-架构设计-洞察建议Prompt库时序图

> **适用范围**: 洞察分析模块的 Prompt 库交互流程
> **核心理念**: L1 预测 + Skill 直接执行 + 异步刷新推荐

---

## 1. 完整时序图

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant UI as 前端 UI
    participant Skill as Skill 执行器
    participant L1 as L1 Router (AI)
    participant Reg as PromptRegistry

    %% ========== 初始加载阶段 ==========
    rect rgb(230, 245, 255)
        Note over U,Reg: 初始加载阶段
        U->>UI: 上传数据/切换到洞察Tab
        UI->>L1: 调用 L1 (传入 df_summary)
        L1-->>UI: 返回推荐列表 + drillHints
        UI->>UI: 渲染初始推荐卡片
        Note right of UI: 卡片底部显示<br/>推荐按钮 + 自选区
    end

    %% ========== 用户采纳推荐 ==========
    rect rgb(230, 255, 230)
        Note over U,Reg: 场景A: 用户采纳 AI 推荐
        U->>UI: 点击推荐按钮 (如"趋势分析")
        UI->>Reg: getPrompt(promptId)
        Reg-->>UI: 返回 Prompt 模板
        UI->>Skill: 直接执行 (参数已由 L1 预填)
        Skill-->>UI: 返回执行结果 (图表+摘要)
        UI->>UI: 渲染结果卡片
        UI->>UI: 从 drillHint 读取下钻选项
        Note right of UI: 显示 AI 预测的<br/>下钻按钮
        
        par 异步刷新推荐
            UI->>L1: 静默调用 L1 (传入 history)
            L1-->>UI: 返回新一轮推荐
            UI->>UI: 刷新推荐区
        end
    end

    %% ========== 用户自选分析 ==========
    rect rgb(255, 245, 230)
        Note over U,Reg: 场景B: 用户自选分析
        U->>UI: 点击"自选分析"
        UI->>UI: 展开下拉菜单 (列选择+方法选择)
        U->>UI: 选择列 + 分析方法
        UI->>Reg: getPrompt(selectedPromptId)
        Reg-->>UI: 返回 Prompt 模板
        UI->>Skill: 执行 (用户自选的参数)
        Skill-->>UI: 返回执行结果
        UI->>UI: 渲染结果卡片
        
        par 异步刷新推荐
            UI->>L1: 静默调用 L1 (传入 history + 自选结果)
            L1-->>UI: 返回新一轮推荐
            UI->>UI: 刷新推荐区
        end
    end

    %% ========== 下钻操作 ==========
    rect rgb(245, 230, 255)
        Note over U,Reg: 场景C: 执行下钻
        U->>UI: 点击下钻按钮 (如"按地区拆分")
        UI->>Skill: 直接执行 (参数已知)
        Skill-->>UI: 返回拆分后的结果
        UI->>UI: 嵌套渲染子卡片
        Note right of UI: 深度 +1<br/>检查是否达到 MAX_DEPTH
        
        alt 未达到最大深度
            UI->>UI: 继续显示下钻选项
            par 异步刷新
                UI->>L1: 静默调用 L1
                L1-->>UI: 返回新推荐
            end
        else 已达到最大深度
            UI->>UI: 不再显示下钻按钮
            Note right of UI: 终止层: 只展示结果
        end
    end
```

---

## 2. 关键节点说明

| 阶段 | AI 调用 | 说明 |
|:---|:---|:---|
| **初始加载** | ✅ L1 同步调用 | 分析数据，返回推荐 + 预填 drillHint |
| **执行推荐/自选/下钻** | ❌ 无 AI 调用 | 直接执行 Skill，参数已知 |
| **执行完成后** | ✅ L1 异步调用 | 静默刷新推荐，传入历史链 |

---

## 3. 数据流示意

```mermaid
flowchart TD
    subgraph 初始化
        A[上传数据] --> B[调用 L1]
        B --> C["返回: 推荐[] + drillHint[]"]
    end

    subgraph 执行循环
        C --> D{用户选择}
        D -->|点击推荐| E[Skill 执行]
        D -->|点击自选| F[选列+选方法]
        F --> E
        E --> G[渲染结果卡片]
        G --> H[从 drillHint 读取下钻选项]
        G --> I[异步调用 L1 刷新推荐]
        I --> C
    end

    subgraph 深度控制
        H --> J{depth < MAX_DEPTH?}
        J -->|是| K[显示下钻按钮]
        J -->|否| L[终止层]
    end
```

---

## 4. L1 输入输出格式

### 4.1 L1 输入
```json
{
  "df_summary": { "columns": [...], "row_count": 1000 },
  "history": [
    { "action": "trend_analysis", "columns": ["日期", "销售额"], "result": "上升趋势" },
    { "action": "trend_by_dimension", "columns": ["日期", "销售额", "地区"], "result": "华东最快" }
  ]
}
```

### 4.2 L1 输出
```json
{
  "recommendations": [
    {
      "promptId": "worker-distribution-v1",
      "params": { "column_name": "销售额" },
      "reason": "销售额方差大，建议查看分布",
      "drillHint": {
        "promptId": "worker-outlier-v1",
        "params": { "column_name": "销售额" },
        "label": "分析异常点"
      }
    }
  ]
}
```

---

*本文档描述洞察分析模块的 Prompt 库交互时序，是技术实现的核心参考。*
