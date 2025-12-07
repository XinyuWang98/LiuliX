import { useI18n } from '@contexts/I18nContext';
import { useTheme } from '@contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

/**
 * 主题切换器组件
 * 显示在导航栏右侧,点击在明亮/暗黑模式间切换
 */
export function ThemeSwitcher() {
    const { t } = useI18n();
    const { currentTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        if (currentTheme.id === 'apple-dark') {
            setTheme('apple-light');
        } else {
            setTheme('apple-dark');
        }
    };

    const isDark = currentTheme.id === 'apple-dark';

    return (
        <button
            className="btn-ghost"
            onClick={toggleTheme}
            style={{
                padding: 'var(--gap-s)',
                borderRadius: 'var(--radius-m)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
            }}
            title={isDark ? t('themes.apple-light') : t('themes.apple-dark')}
        >
            {isDark ? (
                <Moon size={20} />
            ) : (
                <Sun size={20} />
            )}
        </button>
    );
}
