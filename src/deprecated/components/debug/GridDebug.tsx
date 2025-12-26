import { useState } from 'react';
import { VirtualDataGrid } from '../VirtualDataGrid';
import { DuckDBEngine } from '../../db/duckdbEngine';
import { ColumnMetadata } from '../../types/duckdb';

export function GridDebug() {
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [tableName, setTableName] = useState('');
    const [rowCount, setRowCount] = useState(0);
    const [columns, setColumns] = useState<ColumnMetadata[]>([]);

    async function generateData() {
        setLoading(true);
        const engine = DuckDBEngine.getInstance();

        try {
            await engine.init();

            // Generate dummy CSV content
            const rows = 10000; // 10k rows for test
            let csvContent = 'id,name,value,status,date\n';
            for (let i = 0; i < rows; i++) {
                csvContent += `${i},User_${i},${Math.random() * 100},${i % 2 === 0 ? 'Active' : 'Inactive'},2023-01-01\n`;
            }

            const file = new File([csvContent], 'test_data.csv', { type: 'text/csv' });

            // Ingest using existing engine logic
            const result = await engine.ingestCSV(file);

            setTableName(result.tableName);
            setRowCount(result.rowCount);
            setColumns(result.columns);
            setReady(true);
        } catch (e) {
            console.error(e);
            alert('Error generating data: ' + e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            position: 'absolute',
            top: 60,
            left: 50,
            right: 50,
            bottom: 50,
            background: 'var(--bg-panel)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--gap-m)',
            borderRadius: 'var(--radius-l)',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        }}>
            <div style={{ marginBottom: 'var(--gap-m)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--fs-xl)' }}>DuckDB Grid Debug</h2>
                {!ready && (
                    <button
                        onClick={generateData}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--bg-accent)',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Generating...' : 'Generate 10k Rows'}
                    </button>
                )}
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '8px 16px',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    Close (Reload)
                </button>
            </div>

            {ready ? (
                <div style={{ flex: 1, border: '1px solid var(--border)' }}>
                    <VirtualDataGrid
                        tableName={tableName}
                        rowCount={rowCount}
                        columns={columns}
                    />
                </div>
            ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                    Click button to generate test data and render grid.
                </div>
            )}
        </div>
    );
}
