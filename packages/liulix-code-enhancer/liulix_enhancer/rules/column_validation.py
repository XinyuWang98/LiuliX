"""
列存在性检查规则
自动验证DataFrame列是否存在
"""
import ast
from typing import List,Set
from .base import EnhancementRule


class ColumnValidationRule(EnhancementRule):
    """
    在模块顶部注入列存在性检查
    
    转换示例:
      # 原代码
      x = df['income']
      y = df['age']
      
      # 增强后
      # === 列存在性检查 ===
      required_cols = ['income', 'age']
      missing = [c for c in required_cols if c not in df.columns]
      if missing:
          raise ValueError(f"缺少必需列: {missing}")
      
      x = df['income']
      y = df['age']
    """
    
    def __init__(self, columns: List[str], df_name: str = 'df'):
        super().__init__()
        self.columns = columns
        self.df_name = df_name
    
    @property
    def name(self) -> str:
        return 'column_validation'
    
    def apply(self, tree: ast.AST) -> ast.AST:
        """应用规则"""
        if not isinstance(tree, ast.Module):
            return tree
        
        # 提取代码中实际使用的列
        used_cols = self._extract_used_columns(tree)
        
        if not used_cols:
            return tree
        
        # 构建验证代码
        validation_code = f"""
# === 列存在性检查 ===
required_cols = {list(used_cols)}
missing = [c for c in required_cols if c not in {self.df_name}.columns]
if missing:
    raise ValueError(f"缺少必需列: {{missing}}")
"""
        
        # 解析验证代码
        validation_tree = ast.parse(validation_code)
        
        # 插入到模块开头
        tree.body = validation_tree.body + tree.body
        
        # 更新统计
        self._increment_stat('applied_count')
        self._increment_stat('columns_validated', len(used_cols))
        
        return tree
    
    def _extract_used_columns(self, tree: ast.AST) -> Set[str]:
        """从AST中提取使用的列名"""
        columns = set()
        
        for node in ast.walk(tree):
            # 匹配 df['column']
            if (isinstance(node, ast.Subscript) and
                isinstance(node.value, ast.Name) and
                node.value.id == self.df_name and
                isinstance(node.slice, ast.Constant) and
                isinstance(node.slice.value, str)):
                
                col_name = node.slice.value
                # 只添加已知列
                if col_name in self.columns:
                    columns.add(col_name)
        
        return columns
