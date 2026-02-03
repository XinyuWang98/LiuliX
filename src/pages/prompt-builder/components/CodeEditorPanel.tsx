import React from 'react';
import Editor from '@monaco-editor/react';
import { Code, Sparkles } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';
import { CodeLanguage } from '../types';
import './CodeEditorPanel.css';

interface CodeEditorPanelProps {
    code: string;
    language: CodeLanguage;
    onChange: (value: string) => void;
    onSmartParameterize: () => void;
    isParameterizeDisabled: boolean;
}

/**
 * Monaco Editor 代码编辑面板
 * 提供专业的代码编辑体验，支持 Python 和 SQL 语法高亮
 */
export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
    code,
    language,
    onChange,
    onSmartParameterize,
    isParameterizeDisabled
}) => {
    const { t } = useI18n();
    // Monaco Editor 语言映射
    const getMonacoLanguage = () => {
        if (language === CodeLanguage.PYTHON) return 'python';
        if (language === CodeLanguage.SQL) return 'sql';
        return 'plaintext';
    };

    return (
        <div className="code-editor-panel">
            {/* Editor Header */}
            <div className="editor-header">
                <span className="editor-language">
                    <Code size={16} className="icon-inline" />
                    {language === CodeLanguage.UNKNOWN ? 'Python' : language.toUpperCase()} {t('prompt.builder.codeEditor.autoDetected')}
                </span>
                <button
                    className="liuli-button variant-primary size-md"
                    onClick={onSmartParameterize}
                    disabled={isParameterizeDisabled}
                >
                    <Sparkles size={16} className="icon-inline" />
                    {t('prompt.builder.codeEditor.smartParameterize')}
                </button>
            </div>

            {/* Monaco Editor */}
            <div className="monaco-editor-container">
                <Editor
                    height="100%"
                    language={getMonacoLanguage()}
                    value={code}
                    onChange={(value) => onChange(value || '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineHeight: 24,
                        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                        padding: { top: 16, bottom: 16 },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        insertSpaces: true,
                        wordWrap: 'on',
                        renderLineHighlight: 'all',
                        selectOnLineNumbers: true,
                        roundedSelection: false, // 禁用圆角选择框
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        selectionHighlight: false, // 禁用选择高亮
                    }}
                />
            </div>

            {/* Editor Footer */}
            <div className="editor-footer">
                <button
                    className="liuli-button variant-ghost size-sm"
                    onClick={() => onChange(`df['Age'].fillna(df['Age'].median(), inplace=True)
fare_stats = df['Fare'].describe()
print(df['Sex'].value_counts())`)}
                >
                    {t('prompt.builder.codeEditor.pasteExample')}
                </button>
                <button className="liuli-button variant-ghost size-sm" onClick={() => onChange('')}>{t('prompt.builder.codeEditor.clear')}</button>
                <button className="liuli-button variant-ghost size-sm">{t('prompt.builder.codeEditor.importFile')}</button>
            </div>
        </div>
    );
};
