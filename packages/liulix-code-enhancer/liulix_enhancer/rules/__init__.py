"""
增强规则包
"""
from .base import EnhancementRule
from .array_protection import ArrayProtectionRule
from .column_validation import ColumnValidationRule
from .empty_check import EmptyCheckRule
from .exception_wrap import ExceptionWrapRule
from .groupby_enhance import GroupByEnhanceRule
from .plot_protection import PlotProtectionRule
from .sklearn_protection import SklearnProtectionRule
from .json_serializer import JsonSerializerRule  # 🆕 JSON序列化器注入

__all__ = [
    'EnhancementRule',
    'ArrayProtectionRule',
    'ColumnValidationRule',
    'EmptyCheckRule',
    'ExceptionWrapRule',
    'GroupByEnhanceRule',
    'PlotProtectionRule',
    'SklearnProtectionRule',
    'JsonSerializerRule',  # 🆕
]

