import { useRef, useState } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { Upload, AlertCircle, X } from 'lucide-react';
import { parseFile, ParsedFileData } from '@utils/fileParser';
import { formatFileSize, formatLargeNumber } from '@utils/formatters';
import { DuckDBEngine } from '../../db/duckdbEngine';

interface FileUploaderProps {
    onFilesUploaded: (filesData: ParsedFileData[], sampledFlags: boolean[]) => void;
}

interface FileError {
    fileName: string;
    error: string;
}

export function FileUploader({ onFilesUploaded }: FileUploaderProps) {
    const { t } = useI18n();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fileErrors, setFileErrors] = useState<FileError[]>([]);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [currentFileName, setCurrentFileName] = useState<string>('');
    const [showBatchSampleModal, setShowBatchSampleModal] = useState(false);

    // Warn strategy state
    const [warnFiles, setWarnFiles] = useState<{ file: File, rowCount: number, index: number }[]>([]);
    const [processingFiles, setProcessingFiles] = useState<ParsedFileData[]>([]);
    const [sampleRatio, setSampleRatio] = useState(0.2); // Default 20%

    // DuckDB singleton
    const engine = DuckDBEngine.getInstance();

    const handleFiles = async (files: FileList) => {
        setFileErrors([]);
        setIsUploading(true);
        const fileArray = Array.from(files);

        if (fileArray.length > 10) {
            setFileErrors([{ fileName: '', error: t('fileUpload.maxFilesExceeded') }]);
            setIsUploading(false);
            return;
        }

        setUploadProgress({ current: 0, total: fileArray.length });

        try {
            await engine.init(); // Ensure DB is ready

            const results: ParsedFileData[] = [];
            const errors: FileError[] = [];
            const warnings: { file: File, rowCount: number, index: number }[] = [];

            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                setCurrentFileName(file.name);
                setUploadProgress({ current: i + 1, total: fileArray.length });

                try {
                    const ext = file.name.split('.').pop()?.toLowerCase();

                    if (ext === 'csv') {
                        // 1. DuckDB Fast Analysis
                        const analysis = await engine.analyzeCSV(file);

                        // Construct base result (no data yet)
                        const baseResult: ParsedFileData = {
                            fileName: file.name,
                            fileType: 'CSV',
                            fileSize: file.size,
                            originalSize: file.size,
                            originalFile: file,
                            data: [], // Empty for now, DuckDB will handle ingestion
                            columns: [],
                            rowCount: analysis.rowCount,
                            columnCount: 0,
                            isSampled: false // Default
                        };

                        if (analysis.strategy === 'FORCE_SAMPLE') {
                            baseResult.isSampled = true;
                            // Auto-set 20% flag implied by context, handled in DataViewer ingestion
                            console.log(`[FileUploader] Force sampling for ${file.name}`);
                        } else if (analysis.strategy === 'WARN') {
                            warnings.push({ file, rowCount: analysis.rowCount, index: results.length });
                        }

                        results.push(baseResult);
                    } else {
                        // Legacy handling for JSON/XLSX
                        const parsedData = await parseFile(file);
                        results.push(parsedData);
                    }
                } catch (err) {
                    errors.push({ fileName: file.name, error: (err as Error).message });
                }
            }

            if (errors.length > 0) setFileErrors(errors);

            if (warnings.length > 0) {
                // Stall upload, show modal
                setProcessingFiles(results);
                setWarnFiles(warnings);
                setShowBatchSampleModal(true);
                setIsUploading(false); // Pause uploading state while waiting for user
            } else {
                // No warnings, proceed immediately
                finalizeUpload(results);
            }

        } catch (err) {
            setFileErrors([{ fileName: '', error: (err as Error).message }]);
            setIsUploading(false);
        }
    };

    const finalizeUpload = (files: ParsedFileData[]) => {
        // Need to create flags array matching the files
        // If file.isSampled is true (FORCE_SAMPLE), flag is true.
        // warning files logic applied later.
        const flags = files.map(f => !!f.isSampled);
        onFilesUploaded(files, flags);
        setIsUploading(false);
        setWarnFiles([]);
        setProcessingFiles([]);
    };

    const handleConfirmBatchSample = () => {
        // User confirmed sampling for WARN files
        const updatedFiles = [...processingFiles];
        warnFiles.forEach(w => {
            if (updatedFiles[w.index]) {
                updatedFiles[w.index].isSampled = true; // Mark for sampling
            }
        });
        finalizeUpload(updatedFiles);
        setShowBatchSampleModal(false);
    };

    const handleForceImportAll = () => {
        // User chose "Force Import" (No sampling for WARN files)
        // FORCE_SAMPLE files remain sampled (set in handleFiles loop)
        finalizeUpload(processingFiles);
        setShowBatchSampleModal(false);
    };

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFiles(files);
    };
    const handleClick = () => fileInputRef.current?.click();
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) handleFiles(e.target.files);
    };

    return (
        <>
            <div onClick={handleClick} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                style={{ border: `2px dashed ${isDragging ? 'var(--bg-accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-m)', padding: 'var(--gap-xl)', textAlign: 'center', cursor: 'pointer', background: isDragging ? 'var(--hover-bg)' : 'transparent', transition: 'all var(--transition-s)' }}>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileInputChange} multiple style={{ display: 'none' }} />
                <Upload size={48} style={{ margin: '0 auto var(--gap-m)', color: isDragging ? 'var(--bg-accent)' : 'var(--text-secondary)' }} />
                <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)', marginBottom: 'var(--gap-s)' }}>
                    {isUploading ? t('fileUpload.uploadingProgress', { current: uploadProgress.current, total: uploadProgress.total }) : t('fileUpload.clickOrDrag')}
                </p>
                {isUploading && currentFileName && (
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--gap-s)' }}>
                        {t('fileUpload.processingFile', { filename: currentFileName })}
                    </p>
                )}
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{t('fileUpload.supportedFormats')}</p>
            </div>

            {fileErrors.length > 0 && (
                <div style={{ marginTop: 'var(--gap-m)', padding: 'var(--gap-m)', background: 'var(--warning)', borderRadius: 'var(--radius-m)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-s)' }}>
                        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--btn-font-weight)' }}>
                                {fileErrors.length === 1 ? t('fileUpload.parseError') : t('fileUpload.filesFailed', { count: fileErrors.length })}
                            </div>
                            {fileErrors.map((error, index) => (
                                <div key={index} style={{ fontSize: 'var(--fs-xs)', marginTop: 'var(--gap-xs)' }}>
                                    {error.fileName && <strong>{error.fileName}:</strong>} {error.error}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setFileErrors([])} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {showBatchSampleModal && warnFiles.length > 0 && (
                <div className="modal-overlay">
                    <div className="card" style={{ maxWidth: '500px', padding: 'var(--gap-l)' }}>
                        <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--gap-m)', display: 'flex', alignItems: 'center', gap: 'var(--gap-s)' }}>
                            <AlertCircle size={24} color="var(--warning)" />
                            {t('fileUpload.batchLargeFiles', { count: warnFiles.length })}
                        </h3>
                        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--gap-m)' }}>
                            {t('fileUpload.batchSampleHint')}
                        </p>
                        <div style={{ marginBottom: 'var(--gap-m)', padding: 'var(--gap-m)', background: 'var(--bg-main)', borderRadius: 'var(--radius-m)', maxHeight: '200px', overflowY: 'auto' }}>
                            {warnFiles.map((item, i) => (
                                <div key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--gap-xs)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{item.file.name}</span>
                                    <span>{formatLargeNumber(item.rowCount)} {t('fileUpload.rows')} • {formatFileSize(item.file.size)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginBottom: 'var(--gap-m)' }}>
                            <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--gap-s)' }}>
                                {t('fileUpload.sampleRatio')}: {(sampleRatio * 100).toFixed(0)}%
                            </label>
                            <input type="range" min="5" max="20" step="5" value={sampleRatio * 100} onChange={(e) => setSampleRatio(parseInt(e.target.value) / 100)} style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--gap-m)', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={handleForceImportAll}>{t('fileUpload.forceImport')}</button>
                            <button className="btn-primary" onClick={handleConfirmBatchSample}>{t('fileUpload.startSample')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
