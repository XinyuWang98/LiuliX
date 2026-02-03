/**
 * 常用 Python 包配置
 * 用于 Prompt Builder 的导入快捷选择器
 */

export interface CommonPackage {
    module: string;        // 模块名（如 'pandas'）
    statement: string;     // 标准 import 语句
    category: string;      // 分类
    description: string;   // 描述（i18n key）
    pyodideSupported?: boolean; // 是否在Pyodide中支持（默认true）
}

/**
 * 常用 Python 包列表
 */
export const COMMON_PACKAGES: CommonPackage[] = [
    // 数据处理
    {
        module: 'pandas',
        statement: 'import pandas as pd',
        category: 'data',
        description: 'prompt.packages.pandas',
        pyodideSupported: true
    },
    {
        module: 'numpy',
        statement: 'import numpy as np',
        category: 'data',
        description: 'prompt.packages.numpy',
        pyodideSupported: true
    },

    // 可视化
    {
        module: 'matplotlib',
        statement: 'import matplotlib.pyplot as plt',
        category: 'viz',
        description: 'prompt.packages.matplotlib',
        pyodideSupported: true
    },
    {
        module: 'seaborn',
        statement: 'import seaborn as sns',
        category: 'viz',
        description: 'prompt.packages.seaborn',
        pyodideSupported: true
    },
    {
        module: 'plotly',
        statement: 'import plotly.express as px',
        category: 'viz',
        description: 'prompt.packages.plotly',
        pyodideSupported: true
    },

    // 科学计算
    {
        module: 'scipy',
        statement: 'import scipy',
        category: 'science',
        description: 'prompt.packages.scipy',
        pyodideSupported: true
    },
    {
        module: 'sklearn',
        statement: 'from sklearn import *',
        category: 'science',
        description: 'prompt.packages.sklearn',
        pyodideSupported: true
    },

    // 工具库
    {
        module: 'datetime',
        statement: 'from datetime import datetime',
        category: 'util',
        description: 'prompt.packages.datetime',
        pyodideSupported: true
    },
    {
        module: 'json',
        statement: 'import json',
        category: 'util',
        description: 'prompt.packages.json',
        pyodideSupported: true
    },
    {
        module: 'base64',
        statement: 'import base64',
        category: 'util',
        description: 'prompt.packages.base64',
        pyodideSupported: true
    },
    {
        module: 'io',
        statement: 'from io import BytesIO',
        category: 'util',
        description: 'prompt.packages.io',
        pyodideSupported: true
    }
];

/**
 * 按分类获取常用包
 */
export function getPackagesByCategory(category: string): CommonPackage[] {
    return COMMON_PACKAGES.filter(pkg => pkg.category === category);
}

/**
 * 根据模块名查找常用包
 */
export function findPackageByModule(module: string): CommonPackage | undefined {
    return COMMON_PACKAGES.find(pkg => pkg.module === module);
}
