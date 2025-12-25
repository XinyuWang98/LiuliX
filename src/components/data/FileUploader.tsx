import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@contexts/I18nContext';
import { AlertCircle, X } from 'lucide-react';
import { parseFile, ParsedFileData } from '@utils/fileParser';
import { formatFileSize, formatLargeNumber } from '@utils/formatters';
import { DuckDBEngine } from '../../db/duckdbEngine';
import './FileUploader.css';

interface FileUploaderProps {
    onFilesUploaded: (filesData: ParsedFileData[], sampledFlags: boolean[]) => void;
}

interface FileError {
    fileName: string;
    error: string;
}

export interface FileUploaderRef {
    openFileDialog: () => void;
    handleFiles: (files: FileList) => void;
    triggerUpload: () => void; // Alias for openFileDialog
}

export const FileUploader = forwardRef<FileUploaderRef, FileUploaderProps>(({ onFilesUploaded }, ref) => {
    const { t } = useI18n();
    const fileInputRef = useRef<HTMLInputElement>(null);
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
    // DuckDB singleton
    const engine = DuckDBEngine.getInstance();

    useImperativeHandle(ref, () => ({
        openFileDialog: () => fileInputRef.current?.click(),
        handleFiles: (files: FileList) => handleFiles(files),
        triggerUpload: () => fileInputRef.current?.click()
    }));

    const handleFiles = async (files: FileList) => {
        // ... (logic remains the same)
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
                        const analysis = await engine.analyzeCSV(file);
                        const baseResult: ParsedFileData = {
                            fileName: file.name,
                            fileType: 'CSV',
                            fileSize: file.size,
                            originalSize: file.size,
                            originalFile: file,
                            data: [],
                            columns: [],
                            rowCount: analysis.rowCount,
                            columnCount: 0,
                            isSampled: false
                        };

                        if (analysis.strategy === 'FORCE_SAMPLE') {
                            baseResult.isSampled = true;
                        } else if (analysis.strategy === 'WARN') {
                            warnings.push({ file, rowCount: analysis.rowCount, index: results.length });
                        }

                        results.push(baseResult);
                    } else {
                        const parsedData = await parseFile(file);
                        results.push(parsedData);
                    }
                } catch (err) {
                    errors.push({ fileName: file.name, error: (err as Error).message });
                }
            }

            if (errors.length > 0) setFileErrors(errors);

            if (warnings.length > 0) {
                setProcessingFiles(results);
                setWarnFiles(warnings);
                setShowBatchSampleModal(true);
                setIsUploading(false);
            } else {
                finalizeUpload(results);
            }

        } catch (err) {
            setFileErrors([{ fileName: '', error: (err as Error).message }]);
            setIsUploading(false);
        }
    };

    // ... (helper functions remain same)
    const finalizeUpload = (files: ParsedFileData[]) => {
        const flags = files.map(f => !!f.isSampled);
        onFilesUploaded(files, flags);
        setIsUploading(false);
        setWarnFiles([]);
        setProcessingFiles([]);
    };

    const handleConfirmBatchSample = () => {
        const updatedFiles = [...processingFiles];
        warnFiles.forEach(w => {
            if (updatedFiles[w.index]) updatedFiles[w.index].isSampled = true;
        });
        finalizeUpload(updatedFiles);
        setShowBatchSampleModal(false);
    };

    const handleForceImportAll = () => {
        finalizeUpload(processingFiles);
        setShowBatchSampleModal(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) handleFiles(e.target.files);
    };

    return (
        <>
            {/* Hidden Input */}
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileInputChange} multiple style={{ display: 'none' }} />

            {/* Dropzone is REMOVED intentionally. Parent handles drag/drop via ref. */}

            {/* Render Upload Progress if actively uploading */}
            {isUploading && (
                <div style={{ padding: 'var(--gap-m)', background: 'var(--bg-panel)', borderRadius: 'var(--radius-m)', marginBottom: 'var(--gap-m)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', marginBottom: 'var(--gap-s)' }}>
                        {t('fileUpload.uploadingProgress', { current: uploadProgress.current, total: uploadProgress.total })}
                    </p>
                    {currentFileName && (
                        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                            {t('fileUpload.processingFile', { filename: currentFileName })}
                        </p>
                    )}
                </div>
            )}


            {fileErrors.length > 0 && (
                <div className="upload-error-container">
                    <div className="upload-error-header">
                        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                            <div className="upload-error-title">
                                {fileErrors.length === 1 ? t('fileUpload.parseError') : t('fileUpload.filesFailed', { count: fileErrors.length })}
                            </div>
                            {fileErrors.map((error, index) => (
                                <div key={index} className="upload-error-item">
                                    {error.fileName && <strong>{error.fileName}:</strong>} {error.error}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setFileErrors([])} className="error-close-btn">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {showBatchSampleModal && warnFiles.length > 0 && createPortal(
                <div className="modal-overlay">
                    <div className="card batch-modal-content">
                        <h3 className="batch-modal-header">
                            <AlertCircle size={24} color="var(--warning)" />
                            {t('fileUpload.batchLargeFiles', { count: warnFiles.length })}
                        </h3>
                        <p className="batch-modal-desc">
                            {t('fileUpload.batchSampleHint')}
                        </p>
                        <div className="batch-file-list">
                            {warnFiles.map((item, i) => (
                                <div key={i} className="batch-file-item">
                                    <span>{item.file.name}</span>
                                    <span>{formatLargeNumber(item.rowCount)} {t('fileUpload.rows')} • {formatFileSize(item.file.size)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="batch-control-group">
                            <label className="batch-range-label">
                                {t('fileUpload.sampleRatio')}: {(sampleRatio * 100).toFixed(0)}%
                            </label>
                            <input
                                type="range"
                                className="custom-slider"
                                min="5"
                                max="20"
                                step="5"
                                value={sampleRatio * 100}
                                onChange={(e) => setSampleRatio(parseInt(e.target.value) / 100)}
                            />
                        </div>
                        <div className="batch-action-buttons">
                            <button className="btn-secondary" onClick={handleForceImportAll}>{t('fileUpload.forceImport')}</button>
                            <button className="btn-primary" onClick={handleConfirmBatchSample}>{t('fileUpload.startSample')}</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
});
