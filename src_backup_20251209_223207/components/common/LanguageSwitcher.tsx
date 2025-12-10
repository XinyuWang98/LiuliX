import React from 'react';
import { useI18n } from '@contexts/I18nContext';
import { Languages, Check } from 'lucide-react';

/**
 * 语言切换器组件
 * 显示在导航栏,点击弹出语言选择下拉菜单
 */
export function LanguageSwitcher() {
    const { language, availableLanguages, setLanguage } = useI18n();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div style={{ position: 'relative' }}>
            {/* 语言切换按钮 */}
            <button
                className="btn-ghost"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: 'var(--gap-s)',
                    borderRadius: 'var(--radius-m)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--gap-s)',
                }}
                title={language.name}
            >
                <Languages size={20} />
                <span style={{ fontSize: 'var(--fs-sm)' }}>
                    {language.code === 'zh-CN' ? '中' : 'EN'}
                </span>
            </button>

            {/* 下拉菜单 */}
            {isOpen && (
                <>
                    {/* 遮罩层,点击关闭菜单 */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                        }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* 菜单内容 */}
                    <div
                        className="card"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + var(--gap-s))',
                            right: 0,
                            minWidth: '150px',
                            padding: 'var(--gap-s)',
                            zIndex: 1000,
                            boxShadow: 'var(--shadow-lg)',
                        }}
                    >
                        {availableLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                className="btn-ghost"
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: 'var(--gap-s) var(--gap-m)',
                                    borderRadius: 'var(--radius-s)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    textAlign: 'left',
                                    fontSize: 'var(--fs-sm)',
                                }}
                            >
                                <span>{lang.name}</span>
                                {language.code === lang.code && (
                                    <Check size={16} color="var(--bg-accent)" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
