# Reddit 推广文案草稿 (Beta Launch - V7 - Balanced Personal Story)

> **目标用户**: Data Analysts / Developers
> **风格**: Authentic, Relatable, Professional
> **核心卖点**: 100% Private, Browser-only, Real burnout story
> **行动号召**: Join Discord

---

## 选项 A: r/dataanalysis (痛点+实用版，🔥 推荐)

**标题**: Built a browser-based AI data cleaner (Early MVP): 100% private, no hallucinations – come break it?

**正文**:
Hey r/dataanalysis,

We all hate when AI tools hallucinate fake columns, write buggy code, or quietly upload your data.
I built **LiuliX** to fix that – everything runs 100% in your browser.

**How it works (no BS)**:
- Your CSV loads directly into the browser (DuckDB + Pyodide, zero upload)
- AI doesn't write code from scratch – it picks safe templates and fills parameters (no hallucinations)
- Upload → auto clean + analyze → one-click report (charts, trends, anomalies)
- Data never leaves your tab, only anonymized metadata (column names/types) goes to the reasoning model

Super early MVP, still rough, but the core flow is stable.
If you're tired of manual SQL hell and want something truly private + reliable, come break it with me.

No pressure, just want real feedback from people who actually deal with dirty data every day.

DM me "救命" (or "help" if your Chinese is rusty) for an invite code.
**Better yet, join our [Discord](https://discord.gg/Y7NVzzCUbG) to grab a key instantly and chat with me directly.**
First 20 people get in, let's see how much we can break together 🫠

---

## 选项 B: r/SideProject (技术党版)

**标题**: Browser-only data analysis tool with constrained AI (Early MVP) – no hallucinations

**正文**:
Hey r/SideProject,

Most AI data tools are just GPT wrappers that hallucinate code and leak data.
I went for constrained & safe: **LiuliX** – 100% browser-based, zero server involvement.

**Quick tech highlights**:
- DuckDB-WASM + Pyodide for full client-side compute
- DeepSeek V3 only for reasoning on anonymized metadata (no raw values)
- Template injection: AI outputs JSON params → safe pre-tested templates execute locally

Early MVP, looking for browser/WASM nerds to test and roast.
No pressure, just want real feedback from people who actually deal with dirty data every day.

DM me "救命" (or "help" if your Chinese is rusty) for an invite code.
**Better yet, join our [Discord](https://discord.gg/Y7NVzzCUbG) to grab a key instantly and chat with me directly.**
First 20 people get in, let's see how much we can break together 🫠

---

## 选项 C: Personal Story Version (V7 - Balanced Emotion) 🆕

**标题**: I burned out as a data analyst, so I built a private browser-based tool in 30 days (Early MVP，feedback welcome)

**正文**:

Hey r/BusinessIntelligence,

I'm a former data analyst from Nanjing, China.

Last month I hit peak burnout as a data analyst — endless SQL, constant report rewrites, cloud upload paranoia, business teams changing KPIs mid-sprint... I needed a break.

So I gave myself 30 days to **ship** something I actually wanted — domain, deployment, full product: a tool that generates data insights 100% in the browser — fast, private, zero uploads.

I called it **LiuliX**.

**What I shipped in 30 days:**
- Full browser-based analytics (DuckDB-WASM + Pyodide)
- Offline PII masking (no raw data ever leaves your tab)
- Intelligent sampling (handles 100k+ rows without memory crashes)
- One-click report generation (charts, trends, anomalies)
- Clean UI flow (refactored from messy notebook clone)

**Hardest lessons learned:**
- Browser memory limits forced me to rethink everything (Pyodide caps at 512MB)
- 7B local models don't run reliably client-side yet (using DeepSeek API with anonymized metadata instead)
- Smart sampling is the key: 80% row reduction, 95%+ accuracy retention

**Current state:**
This is an **early MVP** — rough edges everywhere, but the core flow is stable.  
100k row limit for now, but roadmap includes incremental processing for larger datasets.

**Why I'm sharing:**
I built this for myself, but if you're also tired of manual SQL hell and want something truly private + reliable, come try it.

Be brutally honest — tell me what's broken, slow, or useless. I need real feedback from people who actually deal with dirty data.

📍 **Demo**: https://www.liulix.com/  
💬 **Discord** (grab invite code + chat): https://discord.gg/FzXqBdWp

First 20 testers get in. Let's see how much we can break together 🫠

Thanks for reading. Even if this only helps one person avoid my burnout, it's worth it.

Excelsior

P.S. I tried making a product demo video... my demo video was super awkward and funny, I was so nervous at the time 😂 Please don't be too harsh!
