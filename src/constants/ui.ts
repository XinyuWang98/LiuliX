/**
 * UI 常量定义 - z-index 层级
 * 统一管理所有 z-index 值，避免魔法数字
 */
export const Z_INDEX = {
    /** 基础内容层 */
    BASE: 0,
    /** 悬浮元素（Tooltip, Dropdown） */
    DROPDOWN: 100,
    /** 固定导航栏 */
    STICKY: 200,
    /** 模态框遮罩 */
    MODAL_BACKDROP: 900,
    /** 模态框内容 */
    MODAL: 1000,
    /** 通知/Toast */
    NOTIFICATION: 1100,
    /** 最顶层（Loading 遮罩） */
    TOP: 9999,
} as const;

/**
 * 时间常量定义（毫秒）
 * 统一管理所有时间相关的魔法数字
 */
export const TIME_MS = {
    /** 节流/防抖默认间隔 */
    DEBOUNCE_DEFAULT: 300,
    /** 轮询/检查间隔 */
    POLL_INTERVAL: 1000,
    /** 短暂延迟（动画完成等） */
    SHORT_DELAY: 100,
    /** 中等延迟 */
    MEDIUM_DELAY: 500,
    /** 长延迟（重试等待） */
    LONG_DELAY: 2000,
    /** 复制成功提示持续时间 */
    COPY_FEEDBACK: 2000,
    /** 缓存有效期（30分钟） */
    CACHE_EXPIRY: 30 * 60 * 1000,
    /** 检测重新执行间隔（7天） */
    REDETECTION_INTERVAL: 7 * 24 * 60 * 1000,
    /** 日志最大保存条数检查间隔（24小时） */
    LOG_AGE_THRESHOLD: 24 * 60 * 60 * 1000,
} as const;
