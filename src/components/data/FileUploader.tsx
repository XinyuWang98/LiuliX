import { useRef, useState } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { Upload, AlertCircle, X } from 'lucide-react';
import { parseFile, shouldSampleFile, sampleData, ParsedFileData } from '@utils/fileParser';
import { formatFileSize, formatLargeNumber } from '@utils/formatters';

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
    const [largeFilesCount, setLargeFilesCount] = useState(0);
    const [sampleRatio, setSampleRatio] = useState(0.1);
    const [allParsedFiles, setAllParsedFiles] = useState<ParsedFileData[]>([]);
    const [largeFileIndices, setLargeFileIndices] = useState<number[]>([]);

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
            const parsedResults: ParsedFileData[] = [];
            const errors: FileError[] = [];

            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                setCurrentFileName(file.name);
                setUploadProgress({ current: i + 1, total: fileArray.length });

                try {
                    const parsedData = await parseFile(file);
                    parsedResults.push(parsedData);
                } catch (err) {
                    const errorMessage = (err as Error).message;
                    let suggestion = '';

                    if (errorMessage.includes('Unsupported file type')) {
                        suggestion = t('fileUpload.errorUnsupportedType');
                    } else if (errorMessage.includes('parsing failed')) {
                        suggestion = t('fileUpload.errorCorrupted');
                    } else {
                        suggestion = t('fileUpload.errorGeneric');
                    }

                    errors.push({ fileName: file.name, error: `${errorMessage} ${suggestion}` });
                }
            }

            if (errors.length > 0) {
                setFileErrors(errors);
            }

            if (parsedResults.length === 0) {
                setIsUploading(false);
                return;
            }

            const largeIndices: number[] = [];
            parsedResults.forEach((data, index) => {
                if (shouldSampleFile(data.rowCount, data.fileSize)) {
                    largeIndices.push(index);
                }
            });

            if (largeIndices.length > 0) {
                setAllParsedFiles(parsedResults);
                setLargeFileIndices(largeIndices);
                setLargeFilesCount(largeIndices.length);
                setShowBatchSampleModal(true);
                setIsUploading(false);
            } else {
                const sampledFlags = new Array(parsedResults.length).fill(false);
                onFilesUploaded(parsedResults, sampledFlags);
                setIsUploading(false);
            }
        } catch (err) {
            setFileErrors([{ fileName: '', error: (err as Error).message }]);
            setIsUploading(false);
        }
    };

    const handleConfirmBatchSample = () => {
        const sampledFlags = new Array(allParsedFiles.length).fill(false);
        const finalFiles = [...allParsedFiles];

        largeFileIndices.forEach(index => {
            const data = allParsedFiles[index];
            const sampledData = sampleData(data.data, sampleRatio);
            finalFiles[index] = { ...data, data: sampledData, rowCount: sampledData.length };
            sampledFlags[index] = true;
        });

        onFilesUploaded(finalFiles, sampledFlags);
        setShowBatchSampleModal(false);
        setLargeFileIndices([]);
        setAllParsedFiles([]);
    };

    const handleForceImportAll = () => {
        const sampledFlags = new Array(allParsedFiles.length).fill(false);
        onFilesUploaded(allParsedFiles, sampledFlags);
        setShowBatchSampleModal(false);
        setLargeFileIndices([]);
        setAllParsedFiles([]);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };

    return (
        <>
            <div onClick={handleClick} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} style={{ border: `2px dashed ${isDragging ? 'var(--bg-accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-m)', padding: 'var(--gap-xl)', textAlign: 'center', cursor: 'pointer', background: isDragging ? 'var(--hover-bg)' : 'transparent', transition: 'all var(--transition-s)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-s)', marginBottom: fileErrors.length > 1 ? 'var(--gap-s)' : '0' }}>
                        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--btn-font-weight)', marginBottom: 'var(--gap-xs)' }}>
                                {fileErrors.length === 1 ? t('fileUpload.parseError') : t('fileUpload.filesFailed', { count: fileErrors.length })}
                            </div>
                            {fileErrors.map((error, index) => (
                                <div key={index} style={{ fontSize: 'var(--fs-xs)', marginTop: 'var(--gap-xs)' }}>
                                    {error.fileName && <strong>{error.fileName}:</strong>} {error.error}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setFileErrors([])} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'inherit' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {showBatchSampleModal && largeFilesCount > 0 && (
                <div className="modal-overlay">
                    <div className="card" style={{ maxWidth: '500px', padding: 'var(--gap-l)' }}>
                        <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--gap-m)', display: 'flex', alignItems: 'center', gap: 'var(--gap-s)' }}>
                            <AlertCircle size={24} color="var(--warning)" />
                            {t('fileUpload.batchLargeFiles', { count: largeFilesCount })}
                        </h3>
                        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--gap-m)', lineHeight: 'var(--line-height)' }}>
                            {t('fileUpload.batchSampleHint')}
                        </p>
                        <div style={{ marginBottom: 'var(--gap-m)', padding: 'var(--gap-m)', background: 'var(--bg-main)', borderRadius: 'var(--radius-m)', maxHeight: '200px', overflowY: 'auto' }}>
                            {largeFileIndices.map((index) => {
                                const file = allParsedFiles[index];
                                return (
                                    <div key={index} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--gap-xs)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{file.fileName}</span>
                                        <span>{formatLargeNumber(file.rowCount)} {t('fileUpload.rows')} • {formatFileSize(file.fileSize)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginBottom: 'var(--gap-m)' }}>
                            <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--gap-s)' }}>
                                {t('fileUpload.sampleRatio')}: {(sampleRatio * 100).toFixed(0)}%
                            </label>
                            <input type="range" min="5" max="20" step="5" value={sampleRatio * 100} onChange={(e) => setSampleRatio(parseInt(e.target.value) / 100)} style={{ width: '100%' }} />
                            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 'var(--gap-s)' }}>
                                {t('fileUpload.sampleResult', { rows: formatLargeNumber(Math.floor(largeFileIndices.reduce((sum, idx) => sum + allParsedFiles[idx].rowCount, 0) * sampleRatio / largeFileIndices.length)) })}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--gap-m)', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => { setShowBatchSampleModal(false); setLargeFileIndices([]); setAllParsedFiles([]); }}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn-secondary" onClick={handleForceImportAll}>{t('fileUpload.forceImport')}</button>
                            <button className="btn-primary" onClick={handleConfirmBatchSample}>{t('fileUpload.startSample')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
