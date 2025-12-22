/**
 * Pyodide可用库配置
 * 定义浏览器环境中Pyodide支持的Python库白名单
 */

/**
 * Pyodide可用库列表（已验证）
 */
export const PYODIDE_AVAILABLE_LIBS = [
    // ===== 数据处理（核心，100%可用） =====
    'numpy',              // 数值计算
    'pandas',             // 数据分析

    // ===== 科学计算（高概率可用） =====
    'scipy',              // 科学计算工具包
    'statsmodels',        // 统计模型（需验证）

    // ===== 机器学习（部分可用） =====
    'scikit-learn',       // 机器学习（Pyodide支持，但可能功能受限）

    // ===== 可视化（浏览器环境受限） =====
    'matplotlib',         // 可能不完全支持（需pyodide-matplotlib）

    // ===== 工具库 =====
    'micropip',           // Pyodide包管理器
    'pyodide_http',       // Pyodide HTTP库

    // ===== 其他常用库 =====
    'regex',              // 正则表达式
    'packaging',          // 包管理工具
] as const;

/**
 * Pyodide库分类
 */
export const PYODIDE_LIB_CATEGORIES = {
    // 必需库（MVP必须可用）
    required: ['numpy', 'pandas'],

    // 科学计算库（推荐）
    scientific: ['scipy', 'statsmodels'],

    // 机器学习库（实验性）
    ml: ['scikit-learn'],

    // 可视化库（实验性）
    viz: ['matplotlib'],

    // 工具库
    utils: ['micropip', 'pyodide_http', 'regex', 'packaging']
} as const;

/**
 * 库导入Prompt模板
 * 用于在AI Prompt中注入可用库信息
 */
export function getPyodideLibsPrompt(): string {
    return `
## 可用Python库

**必需库（100%可用）**：
- \`numpy\`: 数值计算
- \`pandas\`: 数据分析

**科学计算库（推荐）**：
- \`scipy\`: 科学计算工具包
- \`statsmodels\`: 统计模型

**机器学习库（实验性）**：
- \`scikit-learn\`: 机器学习（功能可能受限）

**注意事项**：
1. 浏览器环境中，部分库功能受限（如matplotlib）
2. 避免使用文件I/O操作（如\`open()\`）
3. 避免使用系统调用（如\`os.system()\`）
`.trim();
}

/**
 * 库可用性验证脚本
 * 用于在Pyodide中测试库是否可用
 */
export const PYODIDE_LIB_VALIDATION_SCRIPT = `
import sys
import json

results = {}

# 测试必需库
for lib in ['numpy', 'pandas']:
    try:
        __import__(lib)
        results[lib] = {'available': True, 'version': sys.modules[lib].__version__}
    except ImportError as e:
        results[lib] = {'available': False, 'error': str(e)}

# 测试科学计算库
for lib in ['scipy', 'statsmodels']:
    try:
        __import__(lib)
        results[lib] = {'available': True}
    except ImportError:
        results[lib] = {'available': False}

# 测试机器学习库
try:
    import sklearn
    results['scikit-learn'] = {'available': True, 'version': sklearn.__version__}
except ImportError:
    results['scikit-learn'] = {'available': False}

print(json.dumps(results, indent=2))
`.trim();
