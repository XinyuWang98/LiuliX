"""
GroupBy增强规则
检测groupby操作并添加验证
"""
import ast
from .base import EnhancementRule


class GroupByEnhanceRule(EnhancementRule):
    """
    增强groupby操作
    
    转换示例:
      # 原代码
      grouped = df.groupby('category').mean()
      
      # 增强后
      # === GroupBy检查 ===
      if df['category'].nunique() < 2:
          raise ValueError("分组列 category 唯一值过少，无法分组")
      
      grouped = df.groupby('category').mean()
    """
    
    @property
    def name(self) -> str:
        return 'groupby_enhance'
    
    def apply(self, tree: ast.AST) -> ast.AST:
        """应用规则"""
        if not isinstance(tree, ast.Module):
            return tree
        
        # 查找groupby调用
        group_cols = self._find_groupby_columns(tree)
        
        if not group_cols:
            return tree
        
        # 为每个分组列添加检查
        checks = []
        for col in group_cols:
            check_code = f"""
# === GroupBy检查 ===
if df['{col}'].nunique() < 2:
    raise ValueError(f"分组列 {col} 唯一值过少，无法分组")
"""
            check_tree = ast.parse(check_code)
            checks.extend(check_tree.body)
        
        # 插入检查
        tree.body = checks + tree.body
        
        # 更新统计
        self._increment_stat('applied_count')
        self._increment_stat('groupby_columns', len(group_cols))
        
        return tree
    
    def _find_groupby_columns(self, tree: ast.AST):
        """查找所有groupby的列名"""
        columns = set()
        
        for node in ast.walk(tree):
            # 匹配 df.groupby('col') 或 df.groupby("col")
            if (isinstance(node, ast.Call) and
                isinstance(node.func, ast.Attribute) and
                node.func.attr == 'groupby' and
                len(node.args) > 0):
                
                # 提取第一个参数（分组列）
                arg = node.args[0]
                if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                    columns.add(arg.value)
        
        return columns
