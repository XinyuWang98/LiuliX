// 文件上传模块翻译
export const fileUpload = {
    uploadButton: '上传文件',
    clickOrDrag: '点击或拖拽文件到此处上传',
    uploading: '正在解析文件...',
    uploadingProgress: '正在上传 {current}/{total} 个文件...',
    supportedFormats: '支持 CSV、XLSX、JSON 格式',
    supportedFormatsWithLimit: '支持 CSV、Excel、JSON (最大 {limit})',
    deviceAdaptive: 'ℹ️ 根据您的设备内存自动调整',
    largeFileTitle: '数据集较大',
    largeFileMessage: '您上传的文件包含 {rows} 行数据,文件大小为 {size}。处理大文件可能影响性能,建议进行抽样。',
    batchLargeFiles: '检测到 {count} 个大文件',
    batchSampleHint: '以下文件较大,建议进行抽样:',
    sampleRatio: '抽样比例',
    sampleResult: '抽样后约 {rows} 行',
    forceImport: '强制导入',
    startSample: '立即抽样',
    applyToAll: '应用到所有',
    processingFile: '正在处理: {filename}',
    rows: '行数',
    columns: '列数',
    sampled: '已抽样',
    parseError: '文件解析失败',
    filesUploaded: '成功上传 {count} 个文件',
    maxFilesExceeded: '最多只能同时上传 10 个文件,请减少文件数量。',
    filesFailed: '{count} 个文件解析失败',
    rowLimitExceeded: '文件行数超过 1,000,000 行限制，请先拆分文件或联系管理员。',
    errorUnsupportedType: '请使用 CSV、XLSX 或 JSON 格式。',
    errorCorrupted: '文件可能已损坏或格式不正确。',
    errorGeneric: '请检查文件后重试。',
    inputPlaceholder: '询问任何关于数据的问题...',
    clickOrDragShort: '点击/拖拽文件',
    dropHere: '释放以上传',
    processingInCard: '正在处理 {filename} ({current}/{total})',  // F-18

    // 设备策略展示
    deviceStrategy: {
        title: '您的设备配置',
        memoryTier: '内存档位',
        fileLimit: '文件限制',
        maxRows: 'AI采样',
        concurrency: '并发数',

        // 6档内存等级
        tierLow: '🔴 低配',
        tierStandard: '🟠 标准',
        tierMainstream: '🟡 主流',
        tierHighPerf: '🟢 高性能',
        tierFlagship: '🔵 旗舰',
        tierUltimate: '🟣 极致',

        // 单位
        maxRowsValue: '最多 {rows} 行',
        concurrencyValue: '{count} 个洞察同时执行',
        inferenceTime: '推理时间',
        estimatedTime: '约 {time}',
    },
};
