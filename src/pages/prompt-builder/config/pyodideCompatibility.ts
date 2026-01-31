/**
 * Pyodide包兼容性数据库
 * 用于检测Python包是否能在浏览器环境（Pyodide）中运行
 */

export interface PyodidePackageInfo {
    module: string;
    supported: boolean;
    reason?: string; // 不支持的原因
    alternative?: string; // 替代方案建议
}

/**
 * Pyodide兼容性数据库
 * 
 * 支持的包：可以在Pyodide中运行的纯Python包或已移植的科学计算库
 * 不支持的包：依赖C/C++扩展、系统调用、特定硬件的包
 */
export const PYODIDE_COMPATIBILITY: Record<string, PyodidePackageInfo> = {
    // ========== 支持的包 ==========
    'pandas': { module: 'pandas', supported: true },
    'numpy': { module: 'numpy', supported: true },
    'matplotlib': { module: 'matplotlib', supported: true },
    'scipy': { module: 'scipy', supported: true },
    'scikit-learn': { module: 'scikit-learn', supported: true },
    'requests': { module: 'requests', supported: true },
    'beautifulsoup4': { module: 'beautifulsoup4', supported: true },
    'lxml': { module: 'lxml', supported: true },
    'pillow': { module: 'pillow', supported: true },
    'sqlalchemy': { module: 'sqlalchemy', supported: true },

    // ========== 不支持的包 ==========

    // 深度学习框架（C++依赖）
    'torch': {
        module: 'torch',
        supported: false,
        reason: 'PyTorch依赖C++扩展和CUDA，无法在浏览器环境运行',
        alternative: '建议使用后端API执行或使用ONNX Web Runtime'
    },
    'tensorflow': {
        module: 'tensorflow',
        supported: false,
        reason: 'TensorFlow依赖系统库和硬件加速，浏览器环境不可用',
        alternative: '建议使用TensorFlow.js或后端API'
    },
    'keras': {
        module: 'keras',
        supported: false,
        reason: 'Keras需要TensorFlow后端，无法在Pyodide运行',
        alternative: '建议使用后端服务'
    },

    // NLP库（依赖PyTorch）
    'sentence_transformers': {
        module: 'sentence_transformers',
        supported: false,
        reason: '依赖PyTorch和transformers，无法在Pyodide运行',
        alternative: '建议使用后端服务或预计算embeddings'
    },
    'transformers': {
        module: 'transformers',
        supported: false,
        reason: '依赖PyTorch/TensorFlow，浏览器环境不支持',
        alternative: '建议使用Hugging Face Inference API'
    },

    // 其他系统依赖库
    'opencv-python': {
        module: 'opencv-python',
        supported: false,
        reason: 'OpenCV依赖C++库和系统资源',
        alternative: '建议使用后端处理或opencv.js'
    },
    'psycopg2': {
        module: 'psycopg2',
        supported: false,
        reason: 'PostgreSQL适配器需要系统库连接',
        alternative: '浏览器环境无法直接连接数据库，建议使用后端API'
    },
    'pymysql': {
        module: 'pymysql',
        supported: false,
        reason: 'MySQL连接需要网络套接字',
        alternative: '建议使用后端API'
    }
};

/**
 * 检查包是否在Pyodide中支持
 * @param module 包名
 * @returns 是否支持（未知包默认返回true）
 */
export function isPyodideSupported(module: string): boolean {
    const info = PYODIDE_COMPATIBILITY[module];
    return info?.supported ?? true; // 未知包默认认为支持
}

/**
 * 获取包的Pyodide兼容性信息
 * @param module 包名
 * @returns 兼容性信息对象，如果未知返回null
 */
export function getPyodideInfo(module: string): PyodidePackageInfo | null {
    return PYODIDE_COMPATIBILITY[module] || null;
}

/**
 * 获取所有不支持的包列表
 * @param modules 要检查的包名数组
 * @returns 不支持的包信息数组
 */
export function getUnsupportedPackages(modules: string[]): PyodidePackageInfo[] {
    return modules
        .map(mod => PYODIDE_COMPATIBILITY[mod])
        .filter(info => info && !info.supported) as PyodidePackageInfo[];
}
