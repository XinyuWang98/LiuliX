"""
数组索引保护规则
精确识别并保护数组索引访问，避免IndexError
"""
import ast
from .base import EnhancementRule


class ArrayProtectionRule(EnhancementRule, ast.NodeTransformer):
    """
    保护数组索引访问，避免IndexError
    
    转换示例:
      arr[0]         → (arr[0] if len(arr) > 0 else None)
      values[5]      → (values[5] if len(values) > 5 else None)
      df.index[0]    → 不变（属性访问，不保护）✅ 关键
      value_counts.index[0] → 不变 ✅ 修复今天的bug
    
    关键逻辑：
      - 只保护 Name[int] 模式（简单变量的整数索引）
      - 不保护 Attribute[int]（如 df.index[0]，obj.values[0]）
      - 这样就能精确区分，避免误伤
    """
    
    @property
    def name(self) -> str:
        return 'array_protection'
    
    def apply(self, tree: ast.AST) -> ast.AST:
        """应用规则"""
        return self.visit(tree)
    
    def visit_Subscript(self, node: ast.Subscript) -> ast.AST:
        """
        访问下标节点
        
        这是核心方法，会遍历所有[...]访问
        """
        # 先递归处理子节点
        self.generic_visit(node)
        
        # 关键判断：只保护 Name[int] 模式
        # isinstance(node.value, ast.Name) → 确保是简单变量（如arr, values）
        # isinstance(node.slice, ast.Constant) → 确保是常量索引
        # isinstance(node.slice.value, int) → 确保是整数
        if (isinstance(node.value, ast.Name) and
            isinstance(node.slice, ast.Constant) and
            isinstance(node.slice.value, int)):
            
            var_name = node.value.id  # 变量名，如'arr'
            index = node.slice.value  # 索引值，如0
            
            # 构建安全访问: (arr[idx] if len(arr) > idx else None)
            safe_node = ast.IfExp(
                # 条件: len(arr) > idx
                test=ast.Compare(
                    left=ast.Call(
                        func=ast.Name(id='len', ctx=ast.Load()),
                        args=[ast.Name(id=var_name, ctx=ast.Load())],
                        keywords=[]
                    ),
                    ops=[ast.Gt()],
                    comparators=[ast.Constant(value=index)]
                ),
                # 真分支: arr[idx]
                body=node,
                # 假分支: None
                orelse=ast.Constant(value=None)
            )
            
            # 更新统计
            self._increment_stat('applied_count')
            self._increment_stat('modified_nodes')
            
            return safe_node
        
        # 其他情况（如df.index[0]）保持不变
        return node
