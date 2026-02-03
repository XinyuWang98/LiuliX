"""
JSON 序列化器自动注入规则

自动为所有 json.dumps() 调用注入 NumPy/Pandas 类型的序列化处理器
"""
import ast
from typing import List
from .base import EnhancementRule


class JsonSerializerRule(EnhancementRule):
    """
    自动注入 JSON 序列化器
    
    增强场景:
        print(json.dumps(result))
        → 
        # 自动注入序列化器定义
        def __liulix_json_serializer(obj): ...
        print(json.dumps(result, default=__liulix_json_serializer))
    """
    
    def __init__(self):
        super().__init__()  # ✅ 基类不接受参数
        self.serializer_injected = False
        self.json_dumps_count = 0
    
    @property
    def name(self) -> str:
        """规则名称"""
        return 'json_serializer_injection'
    
    def apply(self, tree: ast.Module) -> ast.Module:
        """应用规则"""
        # 步骤1: 检测是否有 json.dumps() 调用
        json_dumps_calls = self._find_json_dumps(tree)
        
        if not json_dumps_calls:
            return tree  # 无需增强
        
        self.json_dumps_count = len(json_dumps_calls)
        
        # 步骤2: 在模块顶部注入序列化器定义（在所有 import 之后）
        tree = self._inject_serializer_definition(tree)
        
        # 步骤3: 修改所有 json.dumps() 调用，添加 default 参数
        tree = self._add_default_parameter(tree)
        
        self.serializer_injected = True
        return tree
    
    def _find_json_dumps(self, tree: ast.Module) -> List[ast.Call]:
        """查找所有 json.dumps() 调用"""
        json_dumps_calls = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                # 匹配 json.dumps(...)
                if (isinstance(node.func, ast.Attribute) and
                    node.func.attr == 'dumps' and
                    isinstance(node.func.value, ast.Name) and
                    node.func.value.id == 'json'):
                    json_dumps_calls.append(node)
        
        return json_dumps_calls
    
    def _inject_serializer_definition(self, tree: ast.Module) -> ast.Module:
        """在模块顶部（import 之后）注入序列化器定义"""
        
        # 序列化器函数定义（AST 节点）
        serializer_def = ast.parse("""
import numpy as np
import pandas as pd

def __liulix_json_serializer(obj):
    '''LiuliX 自动注入的 JSON 序列化器，处理 NumPy/Pandas 类型'''
    # NumPy 整数类型
    if isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    # NumPy 浮点类型
    if isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    # Pandas NA/NaN
    if pd.isna(obj):
        return None
    # Datetime
    if isinstance(obj, (pd.Timestamp, np.datetime64)):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")
""").body
        
        # 找到最后一个 import 语句的位置
        last_import_idx = -1
        for i, node in enumerate(tree.body):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                last_import_idx = i
        
        # 在 import 之后插入序列化器定义
        insert_pos = last_import_idx + 1
        tree.body = (
            tree.body[:insert_pos] +
            serializer_def +
            tree.body[insert_pos:]
        )
        
        return tree
    
    def _add_default_parameter(self, tree: ast.Module) -> ast.Module:
        """为所有 json.dumps() 添加 default 参数"""
        
        class JsonDumpsTransformer(ast.NodeTransformer):
            def visit_Call(self, node: ast.Call):
                # 递归处理子节点
                self.generic_visit(node)
                
                # 匹配 json.dumps(...)
                if (isinstance(node.func, ast.Attribute) and
                    node.func.attr == 'dumps' and
                    isinstance(node.func.value, ast.Name) and
                    node.func.value.id == 'json'):
                    
                    # 检查是否已有 default 参数
                    has_default = any(
                        kw.arg == 'default' for kw in node.keywords
                    )
                    
                    if not has_default:
                        # 添加 default=__liulix_json_serializer
                        node.keywords.append(
                            ast.keyword(
                                arg='default',
                                value=ast.Name(
                                    id='__liulix_json_serializer',
                                    ctx=ast.Load()
                                )
                            )
                        )
                
                return node
        
        transformer = JsonDumpsTransformer()
        return transformer.visit(tree)
    
    def get_stats(self) -> dict:
        """获取规则统计"""
        return {
            'serializer_injected': self.serializer_injected,
            'json_dumps_modified': self.json_dumps_count
        }
