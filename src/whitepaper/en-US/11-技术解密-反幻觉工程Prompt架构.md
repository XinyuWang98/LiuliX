# 11. Anti-Hallucination Engineering: LiuliX's Prompt Architecture Practice

> **Last Updated**: 2026-01-13

> **Summary**: In the field of data analysis, AI "Hallucination" is unacceptable. This document reveals how LiuliX transforms AI from a "chatty poet" into a "rigorous engineer" through the "Prompt as Code" philosophy and a dual-layer architecture.

---

## 1. Core Challenge: Facts over Poetry

ChatGPT excels at writing poetry because poetry has no standard answer. But data analysis is different:
*   **Input**: `df['price'].mean()`
*   **Output**: Must be a precise floating-point number.

If AI invents a column name or calls a non-existent function, the analysis will crash. This is the core problem LiuliX strives to solve: **How to make probabilistic LLMs produce deterministic analysis results?**

---

## 2. Solution A: Dual-Layer Architecture (L1 Router / L2 Worker)

We didn't try to solve everything with one super Prompt. Instead, we designed a pipeline architecture similar to a CPU:

### L1: Decision Layer (The Router)
*   **Role**: Only does "Multiple Choice Questions", no "Fill-in-the-Blanks".
*   **Principle**: L1 receives data summaries, then selects the most suitable tool from a predefined **Capability List**.
*   **Prompt Example**:
    > "You are a data analyst. Based on the following columns, select the most suitable one from [distribution_analysis, correlation_analysis]. Do not output any code."
*   **Benefit**: Greatly limits AI's divergence space, eliminating "answering for the sake of answering".

### L2: Execution Layer (The Worker)
*   **Role**: Focuses on writing code, ignores business logic.
*   **Principle**: Receives clear instructions (e.g., "draw a histogram of the price column") and strict context (column names, types), outputs executable Python/SQL code.
*   **Benefit**: Smaller context window, more focused, code generation accuracy improved by over 40%.

---

## 3. Solution B: Prompt as Code

In LiuliX, a Prompt is not just random text, but a piece of **Code**. We rigorously require AI to think and output in **JSON format**.

### Why JSON?
Natural language is full of ambiguity, while JSON is structured.
*   **Typing**: We use TypeScript interfaces to strictly define AI's output format.
*   **Validation**: If the JSON returned by AI is missing fields or has type errors, it will be intercepted and rejected directly by the frontend; the user won't even notice the error occurred.

```json
// LiuliX Internal Protocol Example
{
  "thought": "Analyzing price distribution requires excluding outliers",
  "code": "df = df[df['price'] < 1000]\nplt.hist(df['price'])",
  "plot_type": "histogram",
  "confidence": 0.95
}
```

---

## 4. Solution C: AST-Level Code Enhancement

Even if the code written by AI is syntactically correct, it might be logically wrong (e.g., accessing an empty DataFrame).

For this, we developed and open-sourced **[LiuliX Code Enhancer](https://github.com/liulix/code-enhancer)**.

This is not simple regex replacement, but a deep parser based on **AST (Abstract Syntax Tree)**. It automatically injects defensive logic before code execution:

1.  **Null Guard**: Automatically detects if `df` is empty.
2.  **Column Name Check**: Ensures column names referenced in the code actually exist in the data.
3.  **Index Out of Bounds Protection**: Captures `IndexError` immediately and converts it into a friendly hint.

---

## 5. Summary

LiuliX does not trust luck.

Through **L1/L2 Layering**, **JSON Structured Constraints**, and **AST Code Enhancement**, we have reduced the AI hallucination rate to an industrially usable level. We believe that only AI built on a solid engineering foundation is a trustworthy productivity tool.
