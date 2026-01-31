/**
 * 文件上传模块类型定义
 * 包含: fileUpload
 */

export interface FileUploadTranslations {
    // 文件上传
    fileUpload: {
        uploadButton: string;
        clickOrDrag: string;
        clickOrDragShort: string;
        dropHere: string;
        uploading: string;
        uploadingProgress: string;
        supportedFormats: string;
        supportedFormatsWithLimit: string;
        deviceAdaptive: string;
        largeFileTitle: string;
        largeFileMessage: string;
        batchLargeFiles: string;
        batchSampleHint: string;
        sampleRatio: string;
        sampleResult: string;
        forceImport: string;
        startSample: string;
        applyToAll: string;
        processingFile: string;
        rows: string;
        columns: string;
        sampled: string;
        parseError: string;
        filesUploaded: string;
        maxFilesExceeded: string;
        filesFailed: string;
        errorUnsupportedType: string;
        errorCorrupted: string;
        errorGeneric: string;
        inputPlaceholder: string;

        deviceStrategy: {
            title: string;
            memoryTier: string;
            fileLimit: string;
            maxRows: string;
            concurrency: string;
            tierLow: string;
            tierStandard: string;
            tierMainstream: string;
            tierHighPerf: string;
            tierFlagship: string;
            tierUltimate: string;
            maxRowsValue: string;
            concurrencyValue: string;
            inferenceTime: string;
            estimatedTime: string;
        };
    };
}
