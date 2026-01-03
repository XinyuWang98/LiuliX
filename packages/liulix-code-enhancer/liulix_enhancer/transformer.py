"""
LiuliX代码增强器 - 核心Transformer
支持Web(Pyodide)/PC/CLI/服务端的跨平台Python代码增强
"""
import ast
from typing import List, Dict, Any


class CodeEnhancer:
    """
    AST级别的Python代码安全增强器
    
    使用方法:
        enhancer = CodeEnhancer(columns=['col1', 'col2'], df_name='df')
        result = enhancer.enhance(code)
    """
    
    def __init__(self, columns: List[str], df_name: str = 'df'):
        """
        初始化增强器
        
        Args:
            columns: 数据集的列名列表
            df_name: DataFrame变量名（默认'df'）
        """
        self.columns = columns
        self.df_name = df_name
        self.stats: Dict[str, Any] = {}
        
        # 延迟导入规则，避免循环依赖
        from .rules import (
            EmptyCheckRule,
            ColumnValidationRule,
            ArrayProtectionRule,
            GroupByEnhanceRule,
            ExceptionWrapRule
        )
        
        # 注册所有规则（按优先级顺序）
        self.rules = [
            EmptyCheckRule(df_name),
            ColumnValidationRule(columns, df_name),
            ArrayProtectionRule(),
            GroupByEnhanceRule(),
            ExceptionWrapRule()
        ]
    
    def enhance(self, code: str) -> Dict[str, Any]:
        """
        增强Python代码
        
        Args:
            code: 原始Python代码
            
        Returns:
            {
                'code': str,         # 增强后的代码
                'stats': dict,       # 统计信息
                'success': bool,     # 是否成功
                'error': str | None  # 错误信息
            }
        """
        try:
            # 解析为AST
            tree = ast.parse(code)
            
            # 应用所有规则
            for rule in self.rules:
                tree = rule.apply(tree)
                self.stats[rule.name] = rule.get_stats()
            
            # 修复位置信息（必需，否则报错）
            ast.fix_missing_locations(tree)
            
            # 转回代码
            enhanced_code = self._unparse(tree)
            
            return {
                'code': enhanced_code,
                'stats': self.stats,
                'success': True,
                'error': None
            }
            
        except Exception as e:
            # 失败时返回原代码（降级）
            return {
                'code': code,
                'stats': {},
                'success': False,
                'error': str(e)
            }
    
    def _unparse(self, tree: ast.AST) -> str:
        """
        将AST转回Python代码
        兼容不同Python版本
        """
        try:
            # Python 3.9+
            return ast.unparse(tree)
        except AttributeError:
            # Python 3.8，使用astor
            try:
                import astor
                return astor.to_source(tree)
            except ImportError:
                raise RuntimeError(
                    "Python 3.8需要安装astor: pip install astor"
                )


# ===== CLI入口 =====
def main():
    """命令行工具入口"""
    import sys
    import json
    import argparse
    
    parser = argparse.ArgumentParser(
        description='LiuliX代码增强器 - AST级别的Python代码安全增强'
    )
    parser.add_argument(
        'code',
        nargs='?',
        default=None,
        help='要增强的Python代码（或从stdin读取）'
    )
    parser.add_argument(
        '--columns',
        type=str,
        default='[]',
        help='列名JSON数组，如 \'["col1", "col2"]\''
    )
    parser.add_argument(
        '--df-name',
        type=str,
        default='df',
        help='DataFrame变量名（默认"df"）'
    )
    parser.add_argument(
        '--output',
        type=str,
        choices=['code', 'json'],
        default='code',
        help='输出格式：code仅输出代码，json输出完整结果'
    )
    
    args = parser.parse_args()
    
    # 读取代码
    if args.code:
        code = args.code
    else:
        # 从stdin读取
        code = sys.stdin.read()
    
    # 解析列名
    try:
        columns = json.loads(args.columns)
    except json.JSONDecodeError:
        print(f"错误: --columns 必须是有效的JSON数组", file=sys.stderr)
        sys.exit(1)
    
    # 创建增强器
    enhancer = CodeEnhancer(columns=columns, df_name=args.df_name)
    
    # 增强代码  
    result = enhancer.enhance(code)
    
    # 输出结果
    if args.output == 'json':
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if result['success']:
            print(result['code'])
        else:
            print(f"增强失败: {result['error']}", file=sys.stderr)
            sys.exit(1)


if __name__ == '__main__':
    main()
