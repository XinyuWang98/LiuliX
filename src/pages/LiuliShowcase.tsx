import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { LiuliInput } from '@/components/common/liulix/LiuliInput';
import { LiuliTag } from '@/components/common/liulix/LiuliTag';
import { LiuliSwitch } from '@/components/common/liulix/LiuliSwitch';
import { AscensionBackground } from '@/components/common/liulix/AscensionBackground';
import { ProjectSelectionStateDemo } from '@/components/demo/ProjectSelectionStateDemo';
import { DataCleaningDemo } from '@/components/demo/DataCleaningDemo';
import { DataCleaningAtomicDemo } from '@/components/demo/DataCleaningAtomicDemo';
import { InsightChainDemo } from '@/components/demo/InsightChainDemo';
import { Search, Sparkles, AlertCircle, Check, ArrowRight, Settings } from 'lucide-react';
import '@/components/common/liulix/liulix.css';
import './LiuliShowcase.css';

export const LiuliShowcase = () => {
    return (
        <div className="showcase-container">
            <AscensionBackground /> {/* Replaces .showcase-bg-beams */}

            <header className="showcase-header">
                <h1 className="showcase-title">LiuliX Design System</h1>
                <p className="showcase-subtitle">
                    Atomic Component Library (Stage 5) for DataPrism Ascension Theme.
                    <br />
                    Powered by Glassmorphism & Light Beams.
                </p>
                <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
                    <LiuliButton variant="primary" size="lg" leftIcon={<ArrowRight size={18} />}>
                        Get Started
                    </LiuliButton>
                    <LiuliButton variant="secondary" size="lg">
                        Documentation
                    </LiuliButton>
                </div>
            </header>

            <div className="showcase-grid">

                {/* 1. Buttons */}
                <LiuliGlass className="showcase-section" padding="large">
                    <div className="section-title">LiuliButton (Buttons)</div>

                    <div className="component-row">
                        <div className="component-label">Variants</div>
                        <LiuliButton variant="primary">Primary</LiuliButton>
                        <LiuliButton variant="secondary">Secondary</LiuliButton>
                        <LiuliButton variant="ghost">Ghost</LiuliButton>
                        <LiuliButton variant="danger">Danger</LiuliButton>
                    </div>

                    <div className="component-row">
                        <div className="component-label">Sizes</div>
                        <LiuliButton size="sm">Small</LiuliButton>
                        <LiuliButton size="md">Medium</LiuliButton>
                        <LiuliButton size="lg">Large</LiuliButton>
                    </div>

                    <div className="component-row">
                        <div className="component-label">Icons</div>
                        <LiuliButton variant="primary" leftIcon={<Sparkles size={16} />}>
                            Generate
                        </LiuliButton>
                        <LiuliButton variant="secondary" rightIcon={<ArrowRight size={16} />}>
                            Next
                        </LiuliButton>
                        <LiuliButton variant="ghost" size="icon">
                            <Settings size={20} />
                        </LiuliButton>
                    </div>

                    <div className="component-row">
                        <div className="component-label">States</div>
                        <LiuliButton isLoading>Loading</LiuliButton>
                        <LiuliButton disabled>Disabled</LiuliButton>
                    </div>
                </LiuliGlass>

                {/* 2. Inputs */}
                <LiuliGlass className="showcase-section" padding="large">
                    <div className="section-title">LiuliInput (Data Entry)</div>

                    <div className="component-row" style={{ width: '100%' }}>
                        <div className="component-label">Default</div>
                        <LiuliInput placeholder="Enter project name..." />
                    </div>

                    <div className="component-row" style={{ width: '100%' }}>
                        <div className="component-label">With Icon</div>
                        <LiuliInput icon={<Search size={16} />} placeholder="Search data..." />
                    </div>

                    <div className="component-row" style={{ width: '100%' }}>
                        <div className="component-label">Error</div>
                        <LiuliInput error defaultValue="Invalid value" icon={<AlertCircle size={16} />} />
                    </div>
                </LiuliGlass>

                {/* 3. Glass Panels */}
                <div className="showcase-section">
                    <div className="section-title">LiuliGlass (Containers)</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <LiuliGlass intensity="light" className="demo-glass">
                            <p className="demo-label">Light Intensity</p>
                            <LiuliTag variant="neutral" className="mt-2">Neutral</LiuliTag>
                        </LiuliGlass>
                        <LiuliGlass intensity="medium" className="demo-glass">
                            <p className="demo-label">Medium Intensity (Default)</p>
                            <LiuliTag variant="primary" className="mt-2">Primary</LiuliTag>
                        </LiuliGlass>
                        <LiuliGlass intensity="heavy" className="demo-glass">
                            <p className="demo-label">Heavy Intensity</p>
                            <div className="mt-2">
                                <LiuliSwitch checked={true} onChange={() => { }} />
                            </div>
                        </LiuliGlass>
                        <LiuliGlass interactive glow className="demo-glass has-glow">
                            <p className="demo-label">Interactive + Glow</p>
                            <LiuliTag variant="success" className="mt-2">Active</LiuliTag>
                        </LiuliGlass>
                    </div>
                </div>

                {/* [NEW] Glass Variants (v2026) */}
                <div className="showcase-section">
                    <div className="section-title">Glass Variants (v2026 Updates)</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        {/* 1. Vignette (Dark Edge) - For Modals */}
                        <LiuliGlass
                            variant="vignette"
                            blur="ultra"
                            style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <p className="demo-label" style={{ color: '#fff' }}>Variant: Vignette</p>
                                <p className="demo-label" style={{ color: 'var(--text-dim)' }}>Blur: Ultra (200px)</p>
                                <LiuliTag variant="primary" className="mt-2">Settings Modal Style</LiuliTag>
                            </div>
                        </LiuliGlass>

                        {/* 2. Ultra Clear - For Overlays */}
                        <LiuliGlass
                            variant="ultra-clear"
                            blur="standard"
                            style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <p className="demo-label" style={{ color: '#fff' }}>Variant: Ultra Clear</p>
                                <p className="demo-label" style={{ color: 'var(--text-dim)' }}>Blur: Standard</p>
                                <LiuliTag variant="neutral" className="mt-2">Overlay / HUD Style</LiuliTag>
                            </div>
                        </LiuliGlass>
                    </div>
                </div>

                {/* 4. Cards Example (Composition) */}
                <LiuliGlass className="showcase-section" padding="none">
                    <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="section-title" style={{ border: 'none', padding: 0 }}>
                            Composite Card
                        </div>
                    </div>
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ fontSize: 18, color: '#fff' }}>Role Configuration</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                            This is an example of how atoms compose into molecules.
                            The card itself is a LiuliGlass container.
                        </p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <LiuliButton variant="primary" size="sm" leftIcon={<Check size={14} />}>
                                Apply
                            </LiuliButton>
                            <LiuliButton variant="ghost" size="sm">
                                Cancel
                            </LiuliButton>
                        </div>
                    </div>
                </LiuliGlass>

                {/* ========================================================================================== */}
                {/* [NEW] LAYOUT PROTOTYPES (Containerization) */}
                {/* ========================================================================================== */}
                <div className="showcase-section" style={{ gridColumn: '1 / -1' }}>
                    <div className="section-title" style={{ marginBottom: 32 }}>
                        Layout Prototypes (Containerization)
                        <div style={{ fontSize: 14, fontWeight: 'normal', marginTop: 8, opacity: 0.7 }}>
                            Solving the "scattered cards" issue by wrapping modules in cohesive Glass Containers.
                        </div>
                    </div>

                    {/* Prototype A: Project Selection Container */}
                    <LiuliGlass className="layout-container-prototype">
                        {/* Header Area */}
                        <div className="layout-header">
                            <h2 style={{ fontSize: 20, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: 'var(--primary)' }}>❖</span>
                                Project Selection
                            </h2>
                            <LiuliButton variant="ghost" size="sm"> Manage Projects </LiuliButton>
                        </div>

                        {/* Content Area (Grid) */}
                        <div className="layout-grid-content">
                            {/* Mock Project Cards */}
                            {[1, 2, 3].map(i => (
                                <div key={i} className="mock-project-card">
                                    <div className="mock-icon">📂</div>
                                    <div className="mock-details">
                                        <div className="mock-title">Project Alpha_0{i}</div>
                                        <div className="mock-meta">1{i} files · 2h ago</div>
                                    </div>
                                    <div className="mock-action">⋮</div>
                                </div>
                            ))}
                            {/* New Project Card */}
                            <div className="mock-project-card new">
                                <div className="mock-icon-plus">+</div>
                                <div className="mock-title">New Project</div>
                            </div>
                        </div>
                    </LiuliGlass>

                    {/* Prototype B: Data Cleaning Suggestions */}
                    <LiuliGlass className="layout-container-prototype mt-40">
                        <div className="layout-header">
                            <h2 style={{ fontSize: 20, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: 'var(--success)' }}>✨</span>
                                Data Cleaning Suggestions
                            </h2>
                            <LiuliTag variant="success">AI Analyzed</LiuliTag>
                        </div>

                        <div className="layout-list-content">
                            {[1, 2].map(i => (
                                <div key={i} className="mock-suggestion-card">
                                    <div className="mock-sug-header">
                                        <LiuliTag variant="warning">Missing Values</LiuliTag>
                                        <span style={{ fontSize: 12, opacity: 0.5 }}>Table: users.csv</span>
                                    </div>
                                    <p style={{ marginTop: 8, fontSize: 14, color: '#ddd' }}>
                                        Found 240 missing values in 'email' column. Suggest filling with 'unknown' or dropping rows.
                                    </p>
                                    <div className="mock-sug-actions">
                                        <LiuliButton variant="ghost" size="sm">Ignore</LiuliButton>
                                        <LiuliButton variant="primary" size="sm">Apply Fix</LiuliButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </LiuliGlass>

                    {/* Prototype C: Insight Analysis (V2 Demo) */}
                    <div style={{ marginTop: 40 }}>
                        <div className="section-title" style={{ marginBottom: 32 }}>
                            洞察分析链 V2 演示 (InsightChainFlow)
                            <div style={{ fontSize: 14, fontWeight: 'normal', marginTop: 8, opacity: 0.7 }}>
                                展示 AI 驱动的洞察分析流程：推荐操作 → 执行分析 → 查看结果 → 下钻深入
                                <br />
                                新增：玻璃态容器、连接线、结论区高亮、代码块深色模式
                            </div>
                        </div>
                        <InsightChainDemo />
                    </div>

                    {/* ========================================================================================== */}
                    {/* [NEW] Project Selection State Demo (Expanded vs Collapsed) */}
                    {/* ========================================================================================== */}
                    <div style={{ marginTop: 64 }}>
                        <div className="section-title" style={{ marginBottom: 32 }}>
                            项目选择状态演示 (Expanded vs Collapsed)
                            <div style={{ fontSize: 14, fontWeight: 'normal', marginTop: 8, opacity: 0.7 }}>
                                展示"完全展开（等待选择）"和"收起（已选择）"两种状态的对比
                            </div>
                        </div>

                        {/* State 1: 展开状态 (Expanded - Waiting for Selection) */}
                        <div style={{ marginBottom: 40 }}>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 500,
                                color: 'var(--text-accent)',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <span>状态 1:</span>
                                <LiuliTag variant="primary">完全展开</LiuliTag>
                                <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>— 等待用户选择项目</span>
                            </div>
                            <LiuliGlass className="layout-container-prototype">
                                <div className="layout-header">
                                    <h2 style={{ fontSize: 20, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ color: 'var(--primary)' }}>❖</span>
                                        选择项目
                                    </h2>
                                    <LiuliButton variant="ghost" size="sm">管理项目</LiuliButton>
                                </div>

                                {/* 完全展开的项目网格 */}
                                <div className="layout-grid-content">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="mock-project-card">
                                            <div className="mock-icon">📂</div>
                                            <div className="mock-details">
                                                <div className="mock-title">销售数据分析_Q{i}</div>
                                                <div className="mock-meta">{i + 2} files · {i}h ago</div>
                                            </div>
                                            <div className="mock-action">⋮</div>
                                        </div>
                                    ))}
                                    <div className="mock-project-card new">
                                        <div className="mock-icon-plus">+</div>
                                        <div className="mock-title">新建项目</div>
                                    </div>
                                </div>
                            </LiuliGlass>
                        </div>

                        {/* State 2: 收起状态 (Collapsed - After Selection) */}
                        <div>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 500,
                                color: 'var(--success)',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <span>状态 2:</span>
                                <LiuliTag variant="success">已收起</LiuliTag>
                                <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>— 用户已选择项目后</span>
                            </div>
                            <LiuliGlass className="layout-container-prototype project-collapsed">
                                {/* 收起状态：仅显示一个紧凑的选择器 */}
                                <div className="collapsed-project-selector">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                                        <div className="mock-icon">📂</div>
                                        <div style={{ flex: 1 }}>
                                            <div className="mock-title">销售数据分析_Q1</div>
                                            <div className="mock-meta">3 files · 1h ago</div>
                                        </div>
                                    </div>
                                    <LiuliButton variant="ghost" size="sm">切换项目</LiuliButton>
                                </div>
                            </LiuliGlass>
                        </div>
                    </div>

                    {/* ========================================================================================== */}
                    {/* [NEW] Interactive State Demo */}
                    {/* ========================================================================================== */}
                    <div style={{ marginTop: 64 }}>
                        <div className="section-title" style={{ marginBottom: 32 }}>
                            可交互状态演示
                            <div style={{ fontSize: 14, fontWeight: 'normal', marginTop: 8, opacity: 0.7 }}>
                                通过按钮切换展开/收起状态，实时查看效果
                            </div>
                        </div>
                        <ProjectSelectionStateDemo />
                    </div>

                    {/* ========================================================================================== */}
                    {/* [NEW] Data Cleaning Module Demo (Complete Overview) */}
                    {/* ========================================================================================== */}
                    <div style={{ marginTop: 64 }}>
                        <div className="section-title" style={{ marginBottom: 32 }}>
                            数据清洗建议模块演示（完整总览 - 统一版）
                            <div style={{ fontSize: 14, fontWeight: 'normal', marginTop: 8, opacity: 0.7 }}>
                                展示完整的数据清洗工作流：DataViewer（数据预览 + 统计分析）→ 清洗建议（AI建议 + 操作执行）
                                <br />
                                新增：统计信息卡片、微型图表、统一玻璃态容器
                            </div>
                        </div>
                        <DataCleaningDemo />
                    </div>

                    {/* ========================================================================================== */}
                    {/* [NEW] Data Cleaning Atomic Components Demo */}
                    {/* ========================================================================================== */}
                    <div style={{ marginTop: 64 }}>
                        <div className="section-title" style={{ marginBottom: 32 }}>
                            数据清洗原子组件展示（独立调试）
                            <div style={{ fontSize: 14, fontWeight: 'normal', marginTop: 8, opacity: 0.7 }}>
                                拆分的原子组件独立展示，方便调试和修改。修改原子组件会自动应用到上面的总览中
                            </div>
                        </div>
                        <DataCleaningAtomicDemo />
                    </div>

                </div>

                <style>{`
                    .layout-container-prototype {
                        /* Container Style */
                        padding: 0; /* Let children handle padding or header separation */
                        overflow: hidden;
                    }

                    /* 收起状态特殊样式 */
                    .layout-container-prototype.project-collapsed {
                        padding: 16px 24px;
                    }

                    .collapsed-project-selector {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 16px;
                        min-height: 60px;
                    }

                    .layout-header {
                        padding: 24px;
                        border-bottom: 1px solid rgba(255,255,255,0.08);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: rgba(0,0,0,0.2);
                    }
                    .layout-grid-content {
                        padding: 24px;
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 16px;
                    }
                    .layout-list-content {
                        padding: 24px;
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }
                    
                    /* Mock Styles */
                    .mock-project-card {
                        background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 12px;
                        padding: 20px;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        transition: all 0.2s;
                        cursor: pointer;
                    }
                    .mock-project-card:hover {
                        background: rgba(255,255,255,0.06);
                        border-color: rgba(255,255,255,0.2);
                        transform: translateY(-2px);
                    }
                    .mock-project-card.new {
                        border-style: dashed;
                        border-color: rgba(255,255,255,0.2);
                        justify-content: center;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .mock-icon { font-size: 24px; color: var(--primary); }
                    .mock-details { flex: 1; }
                    .mock-title { font-weight: 500; color: #fff; }
                    .mock-meta { font-size: 12px; color: var(--text-dim); margin-top: 4px; }
                    
                    .mock-suggestion-card {
                        background: rgba(255,255,255,0.03);
                        border-left: 3px solid var(--warning); 
                        border-radius: 8px;
                        padding: 16px;
                    }
                    .mock-sug-header { display: flex; align-items: center; justify-content: space-between; }
                    .mock-sug-actions { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
                `}</style>

            </div>
        </div>
    );
};
