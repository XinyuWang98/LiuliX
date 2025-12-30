import React from 'react';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { LiuliInput } from '@/components/common/liulix/LiuliInput';
import { LiuliTag } from '@/components/common/liulix/LiuliTag';
import { LiuliSwitch } from '@/components/common/liulix/LiuliSwitch';
import { AscensionBackground } from '@/components/common/liulix/AscensionBackground'; // [NEW] Unified Background
import { Search, Sparkles, AlertCircle, Check, ArrowRight, Settings } from 'lucide-react';
import '@/components/common/liulix/liulix.css'; // [CRITICAL] Import Core Variables & Styles
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
                <LiuliGlass className="showcase-section" style={{ padding: 24 }}>
                    <div className="showcase-section-title">LiuliButton (Buttons)</div>

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
                <LiuliGlass className="showcase-section" style={{ padding: 24 }}>
                    <div className="showcase-section-title">LiuliInput (Data Entry)</div>

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
                    <div className="showcase-section-title">LiuliGlass (Containers)</div>

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

                {/* 4. Cards Example (Composition) */}
                <LiuliGlass className="showcase-section" style={{ padding: 0 }}>
                    <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="showcase-section-title" style={{ border: 'none', padding: 0 }}>
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

            </div>
        </div>
    );
};
