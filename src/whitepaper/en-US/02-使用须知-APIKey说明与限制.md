# 2. API Key Usage & Limits

> **Last Updated**: 2026-01-13

This document aims to transparently explain LiuliX's AI service policy and the usage limits of the built-in trial Key.

---

## Core Policy

LiuliX Web Version adopts a **"Cloud-Native"** strategy, with built-in DeepSeek models to provide out-of-the-box analysis capabilities.

### Three Usage Modes

| Mode        | **Cloud Mode** (MVP Built-in)    | **Desktop Mode**                         | **BYO Key** (Future) |
| :---------- | :------------------------------- | :--------------------------------------- | :------------------- |
| **PRIVACY** | **Data Upload** (Even Sanitized) | **Fully Offline** (Not supported in Web) | **Vendor Dependent** |
| **COST**    | **Quota Consumed**               | **Free**                                 | **Self-paid**        |
| **LIMIT**   | **Strict Limit**                 | **No Limit**                             | **Vendor Limit**     |
| **SCENE**   | **Quick Trial**                  | **Production** (In Dev)                  | **Specific Needs**   |

---

## Trial Quota Explanation

To prevent abuse and control costs, the built-in DeepSeek API Key has strict usage limits:

### 1. Invitation Code Users (MVP Phase)
- **Total**: **20 times** (Cleaning + Insights)
- **Privilege**: Unlocks Cloud DeepSeek model usage.

### 2. Non-Invitation Code Users
- **Privilege**: **Restricted**.
- **Explanation**: The current Web MVP version requires an **Invitation Code** to use full features. We are developing the Desktop version to support unlimited local models.

> [!TIP]
> **Quota Exhausted?**
> After the quota is used up, we suggest joining our **[Discord Community](https://discord.gg/RnDvjtrs72)** to get a new invitation code, or apply for **LiuliX Desktop Offline (Beta)** access.

---

## Anti-Abuse Mechanism

We have implemented multi-layer protection measures:

1. **Backend Rate Limiting**: Tracks call counts based on `x-invite-code`.
2. **Circuit Breaker**: When the quota is exhausted, the API will return `429 Too Many Requests`.
3. **Frontend Guidance**: UI will clearly display "Trial Quota" to guide users to apply for a new quota.

**Example Limit Response**:
```json
{
  "error": "Invitation code quota exhausted",
  "message": "Your invitation code quota is used up, please switch to local mode to continue using.",
  "usage": 20,
  "limit": 20
}
```

---

## FAQ

### Q: Why can't the Web version connect directly to local models?
**A**: Due to browser security policies (Mixed Content / CORS), purely web-based versions cannot directly access your local Ollama service. We need to develop a dedicated Desktop client to break this limitation.

### Q: Can I buy more quota?
**A**: No. LiuliX does not sell API quotas. If you need extensive cloud computing, please wait for the "Bring Your Own Key" feature to launch, and use your own DeepSeek/OpenAI account directly.

### Q: How to get an Invitation Code?
**A**: Please join the Discord community to claim one.

---

**LiuliX Team**
