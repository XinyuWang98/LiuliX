"""
空数据检查规则
在代码开头注入DataFrame空数据检查
"""
import ast
from .base import EnhancementRule


class EmptyCheckRule(EnhancementRule):
    """
    在模块顶部注入空数据检查
    
    转换示例:
      # 增强后
      # === 空数据检查 ===
      if len(df) == 0:
          raise ValueError("输入数据为空，无法进行分析")
      
      # 原代码...
    """
    
    def __init__(self, df_name: str = 'df'):
        super().__init__()
        self.df_name = df_name
    
    @property
    def name(self) -> str:
        return 'empty_check'
    
    def apply(self, tree: ast.AST) -> ast.AST:
        """应用规则"""
        if not isinstance(tree, ast.Module):
            return tree
        
        # 构建检查代码
        check_code = f"""
# === 空数据检查 ===
if len({self.df_name}) == 0:
    raise ValueError("输入数据为空，无法进行分析")
"""
        
        # 解析检查代码
        check_tree = ast.parse(check_code)
        
        # 插入到模块开头
        tree.body = check_tree.body + tree.body
        
        # 更新统计
        self._increment_stat('applied_count')
        
        return tree
