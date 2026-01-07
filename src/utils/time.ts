/* 时间工具函数 */
export function formatRelativeTime(date: Date | string | number, locale: 'zh-CN' | 'en-US' = 'zh-CN'): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = targetDate.getTime() - now.getTime(); // Negative for past
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    if (Math.abs(diffDay) < 7) return rtf.format(diffDay, 'day');
    if (Math.abs(diffDay) < 30) return rtf.format(Math.round(diffDay / 7), 'week');
    if (Math.abs(diffDay) < 365) return rtf.format(Math.round(diffDay / 30), 'month');
    return rtf.format(Math.round(diffDay / 365), 'year');
}
