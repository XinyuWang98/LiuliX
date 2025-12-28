/**
 * 用户ID与邀请码管理器
 * 使用localStorage + Cookie双重存储确保持久化
 */

const STORAGE_KEY = 'liulix_user_id';
const COOKIE_KEY = 'liulix_uid';
const INVITE_CODE_KEY = 'liulix_invite_code';

/**
 * 获取或生成用户唯一标识
 * @returns {string} 用户ID
 */
export function getUserId(): string {
    // 优先从localStorage读取
    let userId = localStorage.getItem(STORAGE_KEY);

    // 如果localStorage被清除，尝试从Cookie恢复
    if (!userId) {
        userId = getCookie(COOKIE_KEY);
    }

    // 都没有，生成新ID
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 双重存储
    localStorage.setItem(STORAGE_KEY, userId);
    setCookie(COOKIE_KEY, userId, 365); // Cookie有效期1年

    return userId;
}

/**
 * 保存邀请码
 * @param {string} code - 邀请码
 */
export function saveInviteCode(code: string): void {
    localStorage.setItem(INVITE_CODE_KEY, code.toUpperCase());
}

/**
 * 获取邀请码
 * @returns {string | null} 邀请码或null
 */
export function getInviteCode(): string | null {
    return localStorage.getItem(INVITE_CODE_KEY);
}

/**
 * 清除邀请码
 */
export function clearInviteCode(): void {
    localStorage.removeItem(INVITE_CODE_KEY);
}

/**
 * 检查是否有邀请码
 * @returns {boolean}
 */
export function hasInviteCode(): boolean {
    return !!getInviteCode();
}

// Cookie辅助函数
function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const part = parts.pop();
        return part ? part.split(';').shift() || null : null;
    }
    return null;
}

function setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}
