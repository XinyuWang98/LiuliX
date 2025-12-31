import { useState, useRef, useEffect } from 'react';
import { Database, Columns3, BarChart2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliTag } from '@/components/common/liulix/LiuliTag';
import { NumericStatsPanel } from '@/components/datagrid/NumericStatsPanel';
import { CategoricalStatsPanel } from '@/components/datagrid/CategoricalStatsPanel';
import './DataViewerDemo.css';

interface MockFileData {
    id: string;
    name: string;
    rows: number;
    columns: number;
}

interface ColumnStats {
    name: string;
    type: 'numeric' | 'categorical' | 'text';
    uniqueCount: number;
    missingRatio: number;
    distribution: number[]; // 用于微型图
    // 新增：详细统计信息（符合 V2）
    numericStats?: {
        min: number;
        q1: number;
        median: number;
        q3: number;
        max: number;
        stddev: number;
        skewness: number;
    };
    categoricalStats?: {
        topValues: Array<{ value: string; count: number }>;
    };
}

interface MockTableData {
    headers: string[];
    columnStats: ColumnStats[];
    rows: Array<Record<string, any>>;
}

/**
 * DataViewer 演示组件（优化版 - 内嵌统计）
 * 微型图和统计信息直接内嵌在表格列头中
 * 遵循 V2 和 LiuliX Ascension 视觉语言规范
 */
export const DataViewerDemo = () => {
    const [activeFileId, setActiveFileId] = useState('file1');
    const [currentPage, setCurrentPage] = useState(1);
    const [showColumnFilter, setShowColumnFilter] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const rowsPerPage = 10; // 每页显示行数

    // Mock 文件列表
    const mockFiles: MockFileData[] = [
        { id: 'file1', name: 'users.csv', rows: 1240, columns: 8 },
        { id: 'file2', name: 'orders.csv', rows: 3567, columns: 12 },
        { id: 'file3', name: 'products.csv', rows: 892, columns: 6 }
    ];

    // Mock 表格数据（带内嵌统计）
    const mockTableData: Record<string, MockTableData> = {
        file1: {
            headers: ['id', 'name', 'email', 'age', 'city', 'status', 'created_at', 'updated_at'],
            columnStats: [
                {
                    name: 'id',
                    type: 'numeric',
                    uniqueCount: 1240,
                    missingRatio: 0,
                    distribution: [20, 35, 50, 45, 40, 30, 15, 5],
                    numericStats: { min: 1, q1: 310, median: 620, q3: 930, max: 1240, stddev: 358.2, skewness: 0.02 }
                },
                {
                    name: 'name',
                    type: 'text',
                    uniqueCount: 1235,
                    missingRatio: 0,
                    distribution: [42, 38, 35, 30, 28, 25, 22, 18],
                    categoricalStats: {
                        topValues: [
                            { value: 'Alice Chen', count: 1 },
                            { value: 'Bob Wang', count: 1 },
                            { value: 'Carol Li', count: 1 },
                            { value: 'David Zhang', count: 1 },
                            { value: 'Eve Liu', count: 1 }
                        ]
                    }
                },
                {
                    name: 'email',
                    type: 'text',
                    uniqueCount: 998,
                    missingRatio: 0.194,
                    distribution: [40, 35, 32, 28, 25, 20, 15, 10],
                    categoricalStats: {
                        topValues: [
                            { value: 'gmail.com', count: 456 },
                            { value: 'qq.com', count: 234 },
                            { value: '163.com', count: 167 },
                            { value: 'hotmail.com', count: 89 },
                            { value: 'outlook.com', count: 52 }
                        ]
                    }
                },
                {
                    name: 'age',
                    type: 'numeric',
                    uniqueCount: 52,
                    missingRatio: 0,
                    distribution: [5, 15, 35, 48, 52, 45, 28, 12],
                    numericStats: { min: 18, q1: 25, median: 32, q3: 45, max: 78, stddev: 12.5, skewness: 0.85 }
                },
                {
                    name: 'city',
                    type: 'categorical',
                    uniqueCount: 156,
                    missingRatio: 0.021,
                    distribution: [80, 60, 40, 30, 20, 10, 5, 3],
                    categoricalStats: {
                        topValues: [
                            { value: 'Shanghai', count: 245 },
                            { value: 'Beijing', count: 198 },
                            { value: 'Shenzhen', count: 156 },
                            { value: 'Guangzhou', count: 134 },
                            { value: 'Hangzhou', count: 112 }
                        ]
                    }
                },
                {
                    name: 'status',
                    type: 'categorical',
                    uniqueCount: 3,
                    missingRatio: 0,
                    distribution: [85, 12, 3],
                    categoricalStats: {
                        topValues: [
                            { value: 'active', count: 1054 },
                            { value: 'inactive', count: 148 },
                            { value: 'pending', count: 38 }
                        ]
                    }
                },
                {
                    name: 'created_at',
                    type: 'text',
                    uniqueCount: 845,
                    missingRatio: 0,
                    distribution: [15, 25, 35, 40, 38, 30, 22, 10],
                    categoricalStats: {
                        topValues: [
                            { value: '2024-01', count: 105 },
                            { value: '2024-02', count: 98 },
                            { value: '2024-03', count: 92 },
                            { value: '2024-04', count: 87 },
                            { value: '2024-05', count: 83 }
                        ]
                    }
                },
                {
                    name: 'updated_at',
                    type: 'text',
                    uniqueCount: 920,
                    missingRatio: 0,
                    distribution: [10, 18, 28, 38, 42, 35, 25, 12],
                    categoricalStats: {
                        topValues: [
                            { value: '2024-12', count: 412 },
                            { value: '2024-11', count: 256 },
                            { value: '2024-10', count: 134 },
                            { value: '2024-09', count: 78 },
                            { value: '2024-08', count: 40 }
                        ]
                    }
                }
            ],
            rows: [
                { id: '1', name: 'Alice Chen', email: 'alice@example.com', age: '28', city: 'Shanghai', status: 'active', created_at: '2024-01-15', updated_at: '2024-12-30' },
                { id: '2', name: 'Bob Wang', email: '', age: '35', city: 'Beijing', status: 'active', created_at: '2024-02-20', updated_at: '2024-12-29' },
                { id: '3', name: 'Carol Li', email: 'carol@example.com', age: '42', city: 'Shenzhen', status: 'inactive', created_at: '2024-03-10', updated_at: '2024-12-28' },
                { id: '4', name: 'David Zhang', email: 'david@example.com', age: '31', city: 'Guangzhou', status: 'active', created_at: '2024-04-05', updated_at: '2024-12-27' },
                { id: '5', name: 'Eve Liu', email: 'eve@example.com', age: '29', city: 'Hangzhou', status: 'pending', created_at: '2024-05-12', updated_at: '2024-12-26' }
            ]
        },
        file2: {
            headers: ['order_id', 'user_id', 'product', 'amount', 'status', 'date'],
            columnStats: [
                { name: 'order_id', type: 'text', uniqueCount: 3567, missingRatio: 0, distribution: [] },
                { name: 'user_id', type: 'numeric', uniqueCount: 892, missingRatio: 0, distribution: [15, 30, 45, 55, 50, 35, 20, 8] },
                { name: 'product', type: 'categorical', uniqueCount: 234, missingRatio: 0, distribution: [65, 45, 30, 20, 15, 10, 5, 2] },
                { name: 'amount', type: 'numeric', uniqueCount: 2341, missingRatio: 0.013, distribution: [8, 22, 45, 60, 55, 40, 25, 10] },
                { name: 'status', type: 'categorical', uniqueCount: 4, missingRatio: 0, distribution: [80, 15, 4, 1] },
                { name: 'date', type: 'text', uniqueCount: 365, missingRatio: 0, distribution: [] }
            ],
            rows: [
                { order_id: 'ORD-001', user_id: '1', product: 'Laptop', amount: '¥8,999', status: 'completed', date: '2024-12-29' },
                { order_id: 'ORD-002', user_id: '2', product: 'Mouse', amount: '¥199', status: 'pending', date: '2024-12-30' },
                { order_id: 'ORD-003', user_id: '3', product: 'Keyboard', amount: '¥599', status: 'completed', date: '2024-12-28' }
            ]
        },
        file3: {
            headers: ['product_id', 'name', 'category', 'price', 'stock', 'rating'],
            columnStats: [
                { name: 'product_id', type: 'text', uniqueCount: 892, missingRatio: 0, distribution: [] },
                { name: 'name', type: 'text', uniqueCount: 890, missingRatio: 0, distribution: [] },
                { name: 'category', type: 'categorical', uniqueCount: 12, missingRatio: 0, distribution: [45, 30, 25, 20, 15, 10, 8, 5] },
                { name: 'price', type: 'numeric', uniqueCount: 743, missingRatio: 0.009, distribution: [15, 30, 50, 65, 55, 40, 22, 8] },
                { name: 'stock', type: 'numeric', uniqueCount: 234, missingRatio: 0, distribution: [25, 40, 55, 50, 35, 20, 10, 5] },
                { name: 'rating', type: 'numeric', uniqueCount: 42, missingRatio: 0, distribution: [5, 10, 20, 35, 50, 40, 25, 15] }
            ],
            rows: [
                { product_id: 'P001', name: 'MacBook Pro', category: 'Laptop', price: '¥18,999', stock: '23', rating: '4.8' },
                { product_id: 'P002', name: 'Magic Mouse', category: 'Accessory', price: '¥799', stock: '156', rating: '4.5' },
                { product_id: 'P003', name: 'iPad Air', category: 'Tablet', price: '¥4,799', stock: '45', rating: '4.9' }
            ]
        }
    };

    const activeFile = mockFiles.find(f => f.id === activeFileId);
    const activeTableData = mockTableData[activeFileId];

    // 分页计算
    const totalRows = activeFile?.rows || 0;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const startRow = (currentPage - 1) * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, totalRows);

    // 重置分页当文件切换时
    const handleFileChange = (fileId: string) => {
        setActiveFileId(fileId);
        setCurrentPage(1);
    };

    // 初始化所有列为可见
    useEffect(() => {
        if (activeTableData) {
            setVisibleColumns(new Set(activeTableData.headers));
        }
    }, [activeFileId]);

    // 切换列显示/隐藏
    const toggleColumn = (columnName: string) => {
        setVisibleColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(columnName)) {
                newSet.delete(columnName);
            } else {
                newSet.add(columnName);
            }
            return newSet;
        });
    };

    // 点击外部关闭筛选弹窗
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
                const filterPanel = document.querySelector('.column-filter-panel');
                if (filterPanel && !filterPanel.contains(event.target as Node)) {
                    setShowColumnFilter(false);
                }
            }
        };

        if (showColumnFilter) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColumnFilter]);

    // 过滤可见列
    const filteredHeaders = activeTableData.headers.filter(h => visibleColumns.has(h));
    const filteredColumnStats = activeTableData.columnStats.filter(s => visibleColumns.has(s.name));

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'numeric': return '123';
            case 'categorical': return 'Abc';
            case 'text': return 'Txt';
            default: return '📄';
        }
    };

    const renderMiniChart = (stats: ColumnStats) => {
        if (stats.distribution.length === 0) return null;

        const max = Math.max(...stats.distribution);
        return (
            <div className="mini-chart-inline">
                {stats.distribution.map((val, idx) => (
                    <div
                        key={idx}
                        className="bar-inline"
                        style={{
                            height: `${(val / max) * 100}%`,
                            background: stats.missingRatio > 0.1 ? 'var(--warning)' : 'var(--primary)'
                        }}
                    />
                ))}
            </div>
        );
    };

    // 渲染详细统计面板（复用现有组件）
    const renderDetailedStats = (stats: ColumnStats) => {
        // 数值型统计：使用 NumericStatsPanel
        if (stats.type === 'numeric' && stats.numericStats) {
            return <NumericStatsPanel stat={stats.numericStats} />;
        }

        // 分类型和TEXT类型统计：使用 CategoricalStatsPanel
        if ((stats.type === 'categorical' || stats.type === 'text') && stats.categoricalStats) {
            return (
                <CategoricalStatsPanel
                    stat={stats.categoricalStats}
                    type={stats.type}
                    columnName={stats.name}
                />
            );
        }

        return null;
    };

    return (
        <div className="data-viewer-demo">
            <LiuliGlass className="viewer-container" variant="default">
                {/* 文件标签栏 */}
                <div className="file-tabs">
                    <div className="tabs-left">
                        {mockFiles.map(file => (
                            <button
                                key={file.id}
                                className={`file-tab ${activeFileId === file.id ? 'active' : ''}`}
                                onClick={() => handleFileChange(file.id)}
                            >
                                <Database size={14} />
                                <span className="tab-name">{file.name}</span>
                                <span className="tab-stats">{file.rows.toLocaleString()} 行</span>
                            </button>
                        ))}
                    </div>
                    <div className="tabs-right">
                        <LiuliTag variant="neutral">
                            <Columns3 size={12} />
                            {filteredHeaders.length} / {activeFile?.columns} 列
                        </LiuliTag>
                        <LiuliTag variant="primary">
                            <BarChart2 size={12} />
                            {activeFile?.rows.toLocaleString()} 行
                        </LiuliTag>

                        {/* 列筛选按钮 */}
                        <button
                            ref={filterButtonRef}
                            className="column-filter-btn"
                            onClick={() => setShowColumnFilter(!showColumnFilter)}
                            title="列筛选"
                        >
                            <Filter size={14} />
                        </button>

                        {/* 列筛选面板 */}
                        {showColumnFilter && (
                            <div className="column-filter-panel">
                                <div className="filter-header">
                                    <span className="filter-title">列筛选</span>
                                    <span className="filter-count">
                                        {visibleColumns.size} / {activeTableData.headers.length}
                                    </span>
                                </div>
                                <div className="filter-list">
                                    {activeTableData.headers.map(header => (
                                        <label key={header} className="filter-item">
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.has(header)}
                                                onChange={() => toggleColumn(header)}
                                            />
                                            <span className="filter-label">{header}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 数据表格（固定表头） */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {filteredColumnStats.map((stats, idx) => (
                                    <th key={idx}>
                                        <div className="header-cell-inline">
                                            {/* 列名 */}
                                            <div className="column-name">{stats.name}</div>

                                            {/* 数据类型 */}
                                            <div className="column-type">
                                                {getTypeIcon(stats.type)} {stats.type}
                                            </div>

                                            {/* 缺失率进度条 （新增，符合 V2）*/}
                                            <div className="missing-rate-container">
                                                <div className="missing-rate-bar-bg">
                                                    <div
                                                        className="missing-rate-bar-fill"
                                                        style={{
                                                            width: `${stats.missingRatio * 100}%`,
                                                            backgroundColor:
                                                                stats.missingRatio > 0.5 ? 'var(--error)' :
                                                                    stats.missingRatio > 0.1 ? 'var(--warning)' :
                                                                        'var(--success)'
                                                        }}
                                                    />
                                                </div>
                                                <span className="missing-rate-text">
                                                    {(stats.missingRatio * 100).toFixed(1)}%
                                                </span>
                                            </div>

                                            {/* 微型图 */}
                                            {renderMiniChart(stats)}

                                            {/* Unique 值计数（新增，符合 V2） */}
                                            <div className="unique-count">
                                                {stats.uniqueCount > 0 && `${stats.uniqueCount} unique`}
                                            </div>

                                            {/* 详细统计面板（新增，符合 V2） */}
                                            {renderDetailedStats(stats)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {activeTableData.rows.map((row, rowIdx) => (
                                <tr key={rowIdx}>
                                    {filteredHeaders.map((header, colIdx) => (
                                        <td key={colIdx}>
                                            <div className={`cell-content ${!row[header] ? 'null-value' : ''}`}>
                                                {row[header] || <span className="null-indicator">NULL</span>}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 底部统计栏与分页 */}
                <div className="stats-bar">
                    <div className="stats-left">
                        <span className="stats-item">
                            显示 {startRow + 1}-{endRow} / {totalRows.toLocaleString()} 行
                        </span>
                        <span className="stats-item">总计 {activeFile?.columns} 列</span>
                    </div>
                    <div className="stats-right">
                        <div className="pagination-controls">
                            <button
                                className="page-btn"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="page-indicator">
                                第 {currentPage} / {totalPages} 页
                            </span>
                            <button
                                className="page-btn"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </LiuliGlass>
        </div>
    );
};
