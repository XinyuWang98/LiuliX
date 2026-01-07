---
description: 创建新文档并维护文档索引的标准流程
---

# 📝 新建文档工作流 (/new_doc)

此流程总结自 **`Documenting Report DnD Task`** 和 **`MVP Deployment Checklist`** 对话。
在这些对话中，我们发现“新建文档后忘记更新导航”是常见遗漏点，因此将其固化为流程。

## 1. 选址与命名 (Location & Naming)
1.  **分类**：根据文档内容选择目录（`01-架构`, `02-日志`, `04-专题` 等）。
2.  **命名**：必须遵循 `序号-类别-中文名称.md` 格式。
    *   *Ref*: `docs/Users/catherinewang/Documents/GitHub/LiuliX/docs/00-必读/📖文档归类维护规则-Agent必读.md`
    *   *Bad*: `new-feature.md`
    *   *Good*: `15-架构-新功能设计方案.md`

## 2. 编写内容 (Drafting)
1.  **头部元数据**：包含作者、日期、关联的 Issue 或对话 ID。
2.  **正文**：
    *   背景与现状
    *   设计方案/变更点
    *   验证计划

## 3. 注册索引 (Indexing) - **核心步骤**
1.  **打开导航文件**：`docs/00-必读/📚文档导航.md`。
2.  **插入链接**：在对应的章节下列出新文档。
    *   *格式*：`- [📄 文档标题](../path/to/doc.md)`
3.  **验证链接**：确保相对路径正确。

## 4. 提交 (Commit)
1.  同时提交新文档和更新后的导航文件。
