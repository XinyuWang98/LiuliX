import { useState } from 'react';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { LiuliTag } from '@/components/common/liulix/LiuliTag';
import './ProjectSelectionStateDemo.css';

/**
 * 项目选择状态演示组件
 * 可交互地展示"展开"和"收起"两种状态
 */
export const ProjectSelectionStateDemo = () => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="project-state-demo-container">
            {/* 控制面板 */}
            <div className="demo-control-panel">
                <div className="control-header">
                    <h3>项目选择状态演示</h3>
                    <div className="control-status">
                        当前状态:
                        <LiuliTag variant={isExpanded ? 'primary' : 'success'}>
                            {isExpanded ? '完全展开' : '已收起'}
                        </LiuliTag>
                    </div>
                </div>
                <LiuliButton
                    variant="secondary"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    切换为 {isExpanded ? '收起' : '展开'} 状态
                </LiuliButton>
            </div>

            {/* 状态展示区域 */}
            <div className="demo-display-area">
                {isExpanded ? (
                    /* 展开状态 */
                    <LiuliGlass className="project-container-expanded">
                        <div className="project-header">
                            <h2 className="project-title">
                                <span className="title-icon">❖</span>
                                选择项目
                            </h2>
                            <LiuliButton variant="ghost" size="sm">管理项目</LiuliButton>
                        </div>

                        <div className="project-grid">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="project-card">
                                    <div className="card-icon">📂</div>
                                    <div className="card-details">
                                        <div className="card-title">销售数据分析_Q{i}</div>
                                        <div className="card-meta">{i + 2} files · {i}h ago</div>
                                    </div>
                                    <div className="card-action">⋮</div>
                                </div>
                            ))}
                            <div className="project-card new">
                                <div className="card-icon-plus">+</div>
                                <div className="card-title">新建项目</div>
                            </div>
                        </div>
                    </LiuliGlass>
                ) : (
                    /* 收起状态 */
                    <LiuliGlass className="project-container-collapsed">
                        <div className="project-selector-compact">
                            <div className="selector-content">
                                <div className="card-icon">📂</div>
                                <div className="selector-info">
                                    <div className="card-title">销售数据分析_Q1</div>
                                    <div className="card-meta">3 files · 1h ago</div>
                                </div>
                            </div>
                            <LiuliButton variant="ghost" size="sm">切换项目</LiuliButton>
                        </div>
                    </LiuliGlass>
                )}
            </div>
        </div>
    );
};
