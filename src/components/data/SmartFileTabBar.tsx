import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { Project } from '../cleaning/types/cleaning.types';
import { useI18n } from '../../contexts/I18nContext';
import './SmartFileTabBar.css';

interface SmartFileTabBarProps {
    files: Project['files'];
    activeFileId: string | null;
    onFileChange: (fileId: string) => void;
}

const TAB_GAP = 4; // CSS gap: 4px
const TAB_PADDING = 24; // CSS padding: 0 12px -> 24px
const ICON_WIDTH = 14 + 6; // Icon size 14 + gap 6
// Removed fixed MORE_BTN_WIDTH

export const SmartFileTabBar: React.FC<SmartFileTabBarProps> = ({ files, activeFileId, onFileChange }) => {
    const { t } = useI18n();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Helper for score color
    const getScoreColor = (score?: number) => {
        if (score === undefined) return 'var(--text-tertiary)';
        if (score >= 85) return 'var(--success)'; // 健康：85+
        if (score >= 60) return 'var(--warning)'; // 警告：60-84
        return 'var(--error)'; // 严重：<60
    };
    const [visibleCount, setVisibleCount] = useState(files.length);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Width calculation logic
    useLayoutEffect(() => {
        const calculateVisibleTabs = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.offsetWidth;
            const context = document.createElement('canvas').getContext('2d');
            if (!context) return;

            // Font matches CSS: 14px system font
            context.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

            let currentWidth = 0;
            let count = 0;
            const paddingRight = 24; // var(--gap-m) from CSS

            // Calculate width of "Moving" More button
            // If we have hidden files, we need space for "More (N)"
            // Since N changes, let's estimate for typical N (1-99) or just measure "More (99)"
            const moreBtnText = t('cleaning.moreCount', { count: 99 });
            const moreBtnWidth = context.measureText(moreBtnText).width + 16 + 14 + 6; // text + padding(16) + icon(14) + gap(6)

            const availableWidth = containerWidth - paddingRight - moreBtnWidth;

            // First pass: Check if ALL fit without "More" button
            let totalWidthAll = 0;
            for (const f of files) {
                totalWidthAll += context.measureText(f.data.fileName).width + TAB_PADDING + ICON_WIDTH + TAB_GAP;
            }
            // Remove last gap
            if (files.length > 0) totalWidthAll -= TAB_GAP;

            if (totalWidthAll <= containerWidth - paddingRight) {
                setVisibleCount(files.length);
                return;
            }

            // If not all fit, calculate how many fit within availableWidth (reserved for More button)
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const textWidth = context.measureText(file.data.fileName).width;
                const tabWidth = textWidth + TAB_PADDING + ICON_WIDTH;

                if (currentWidth + tabWidth > availableWidth) {
                    break;
                }

                currentWidth += tabWidth + TAB_GAP;
                count++;
            }

            setVisibleCount(Math.max(1, count));
        };

        calculateVisibleTabs();

        const observer = new ResizeObserver(calculateVisibleTabs);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [files, containerRef.current, t]); // Added t dependency


    // Ensure active file is kept in sync if needed? 
    // Actually, design requirement: "Active file" logic is handled by "More" button highlighting.
    // If active file is hidden, overflow button is highlighted.

    if (!files || files.length === 0) return null;

    const visibleFiles = files.slice(0, visibleCount);
    const hiddenFiles = files.slice(visibleCount);
    const hasHiddenFiles = hiddenFiles.length > 0;
    const isActiveFileHidden = hiddenFiles.some(f => f.id === activeFileId);

    return (
        <div className="smartFileTabBar" ref={containerRef}>
            {/* Visible Tabs */}
            {visibleFiles.map(file => (
                <button
                    key={file.id}
                    className={`smartTab ${file.id === activeFileId ? 'active' : ''}`}
                    onClick={() => onFileChange(file.id)}
                    title={file.data.fileName}
                >
                    <FileText size={14} className="tabIcon" />
                    <span className="tabName">{file.data.fileName}</span>
                    {file.data.qualityScore !== undefined && (
                        <span style={{
                            fontSize: 'var(--fs-xxs)',
                            fontWeight: '600',
                            color: getScoreColor(file.data.qualityScore),
                            background: 'var(--bg-panel)',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            marginLeft: '4px',
                            border: `1px solid ${getScoreColor(file.data.qualityScore)}`,
                            opacity: 0.9
                        }}>
                            {file.data.qualityScore}
                        </span>
                    )}
                </button>
            ))}

            {/* Overflow Menu Button */}
            {hasHiddenFiles && (
                <div className="overflowContainer" ref={menuRef}>
                    <button
                        className={`smartTab overflowBtn ${isActiveFileHidden ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        title={t('cleaning.moreFiles') || 'More Files'}
                    >
                        <span>{t('cleaning.moreCount', { count: hiddenFiles.length })}</span>
                        <ChevronDown size={14} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="overflowMenu">
                            {hiddenFiles.map(file => (
                                <button
                                    key={file.id}
                                    className={`menuItem ${file.id === activeFileId ? 'active' : ''}`}
                                    onClick={() => {
                                        onFileChange(file.id);
                                        setIsMenuOpen(false);
                                    }}
                                    title={file.data.fileName}
                                >
                                    <FileText size={14} />
                                    <span className="menuItemName">{file.data.fileName}</span>
                                    {file.data.qualityScore !== undefined && (
                                        <span style={{
                                            fontSize: 'var(--fs-xxs)',
                                            color: getScoreColor(file.data.qualityScore),
                                            marginLeft: 'auto'
                                        }}>
                                            {file.data.qualityScore}分
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
