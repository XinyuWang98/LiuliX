"""
LiuliX代码增强器 - Setup配置
跨平台Python包，支持Web(Pyodide)/PC/CLI/服务端
"""
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="liulix-code-enhancer",
    version="1.0.0",
    author="LiuliX Team",
    author_email="team@liulix.io",
    description="AST-based Python code enhancer for data analysis",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/liulix/code-enhancer",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Topic :: Software Development :: Code Generators",
        "Topic :: Software Development :: Quality Assurance",
    ],
    python_requires=">=3.8",
    install_requires=[
        # 零依赖！astor可选，仅Python 3.8需要
    ],
    extras_require={
        "py38": ["astor>=0.8.1"],
        "dev": ["pytest>=7.0.0", "pytest-cov>=4.0.0"],
    },
    entry_points={
        "console_scripts": [
            "liulix-enhance=liulix_enhancer.transformer:main",
        ],
    },
)
