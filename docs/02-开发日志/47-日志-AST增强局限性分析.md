# 2026-01-07 AST增强器局限性分析日志

## 1. 背景
用户反馈虽然启用了 v3.0 AST 代码增强方案，但在下钻分析场景下，Matplotlib 绘图依然报 `IndexError`（空数据）错误。

## 2. 问题分析

### 2.1 现象
- **操作**: 下钻分析 "Compare house values by ocean proximity"
- **报错**: `IndexError: index 0 is out of bounds for axis 0 with size 0` (at `_post_plot_logic`)
- **日志**: 显示 `AST增强成功 {rulesApplied: 5}`

### 2.2 根因定位
通过检查 `liulix-code-enhancer` 的规则实现逻辑（推断）和前端 `PyodideEnhancerAdapter` 代码，发现：
1. **检查浅层化**: 现有的 `EmptyCheckRule` 仅检查了代码入口处的 `df` 长度。
2. **中间状态丢失**: 下钻操作通常包含过滤逻辑（如 `df = df[df['col'] == 'val']`）。如果此过滤导致结果为空，由于 `df` 变量名被复用或新变量未被追踪，后续的绘图操作直接使用了这个空数据，导致越界。
3. **绘图无防护**: Matplotlib 的绘图函数没有内置自动的空检查，且 AST 规则未对绘图调用进行 Hook 防护。

## 3. 改进计划 (v3.1)

### 3.1 核心升级
需要升级 Python 端 `liulix-code-enhancer` 包的 `CodeVisitor`：

```python
# 目标增强效果
data = df[df['col'] == 'unknown']  # 假如结果为空

# ...

# [自动注入]
if len(data) == 0:
    print("Warning: Data provided to plot is empty")
else:
    data.plot(kind='bar')
```

### 3.2 临时规避
在 Prompt 模板中手动增加防御性逻辑，作为 AST 升级前的过渡方案。

## 4. 关联文档
- [123-专题-Prompt库AI代码质量提升方案.md](../04-技术专题/02-Prompt库/123-专题-Prompt库AI代码质量提升方案.md)
- [51-管理-错误日志记录.md](../05-项目管理/51-管理-错误日志记录.md)
