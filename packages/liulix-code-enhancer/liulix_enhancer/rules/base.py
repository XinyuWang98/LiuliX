"""
规则基类
所有增强规则的抽象基类
"""
import ast
from abc import ABC, abstractmethod
from typing import Dict, Any


class EnhancementRule(ABC):
    """
    增强规则抽象基类
    
    所有规则必须继承此类并实现apply()和name属性
    """
    
    def __init__(self):
        """初始化统计信息"""
        self._stats: Dict[str, Any] = {
            'applied_count': 0,
            'modified_nodes': 0
        }
    
    @abstractmethod
    def apply(self, tree: ast.AST) -> ast.AST:
        """
        应用规则到AST
        
        Args:
            tree: Python AST
            
        Returns:
            modified_tree: 修改后的AST
        """
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """规则名称"""
        pass
    
    def get_stats(self) -> Dict[str, Any]:
        """
        获取统计信息
        
        Returns:
            统计字典
        """
        return self._stats.copy()
    
    def _increment_stat(self, key: str, value: int = 1):
        """增加统计计数"""
        if key not in self._stats:
            self._stats[key] = 0
        self._stats[key] += value
