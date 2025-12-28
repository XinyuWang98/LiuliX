import React from 'react';
import { ConnectionPoint } from './types';

interface ConnectionLinesProps {
    connections: { start: ConnectionPoint; end: ConnectionPoint }[];
}

/**
 * SVG 连接线层
 * 绘制平滑的贝塞尔曲线连接父子节点
 */
// 视觉常量定义 (避免魔法数字)
const STYLES = {
    GLOW_WIDTH: 6,
    CORE_WIDTH: 2,
    DASH_ARRAY: "6 3",
    START_RADIUS: 4,
    END_RADIUS: 3
};

/**
 * SVG 连接线层
 * 绘制平滑的贝塞尔曲线连接父子节点
 */
export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ connections }) => {
    // Debug log
    // console.log('[Forest] Rendering Connections:', connections.length, connections);

    return (
        <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        >
            <defs>
                <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {connections.map((conn, idx) => {
                const { start, end } = conn;

                if (!start || !end) return null;

                // 贝塞尔曲线控制点
                // 确保线是先水平出来，再弯曲，最后水平进入
                const midX = (start.x + end.x) / 2;

                // 路径指令
                const pathData = `
                    M ${start.x} ${start.y}
                    C ${midX} ${start.y},
                      ${midX} ${end.y},
                      ${end.x} ${end.y}
                `;

                return (
                    <g key={`${start.id}-${end.id}-${idx}`}>
                        {/* 阴影/发光层 */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke="rgba(59, 130, 246, 0.3)"
                            strokeWidth={STYLES.GLOW_WIDTH}
                            filter="url(#glow-line)"
                            className="opacity-60"
                        />
                        {/* 实体线 */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke="var(--forest-line-color)"
                            strokeWidth={STYLES.CORE_WIDTH}
                            strokeDasharray={STYLES.DASH_ARRAY}
                            className="animate-dash"
                        />
                        {/* 端点圆点 */}
                        <circle cx={start.x} cy={start.y} r={STYLES.START_RADIUS} fill="var(--forest-accent)" />
                        <circle cx={end.x} cy={end.y} r={STYLES.END_RADIUS} fill="var(--forest-line-color)" />
                    </g>
                );
            })}
        </svg>
    );
};
