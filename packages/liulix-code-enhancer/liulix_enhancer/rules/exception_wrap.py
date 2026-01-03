"""
全局异常捕获规则
将整个代码块包装在try-except中
"""
import ast
from .base import EnhancementRule


class ExceptionWrapRule(EnhancementRule):
    """
    全局异常捕获，友好错误提示
    
    转换示例:
      # 原代码
      result = df.mean()
      
      # 增强后
      try:
          result = df.mean()
      except IndexError as e:
          raise ValueError(f"数据索引越界: {str(e)}")
      except KeyError as e:
          raise ValueError(f"列不存在: {str(e)}")
      except ZeroDivisionError:
          raise ValueError("除零错误（可能是分组后某组数据为空）")
    """
    
    @property
    def name(self) -> str:
        return 'exception_wrap'
    
    def apply(self, tree: ast.AST) -> ast.AST:
        """应用规则"""
        if not isinstance(tree, ast.Module):
            return tree
        
        # 将所有语句包装在try块中
        try_node = ast.Try(
            body=tree.body,
            handlers=[
                # IndexError处理
                ast.ExceptHandler(
                    type=ast.Name(id='IndexError', ctx=ast.Load()),
                    name='e',
                    body=[
                        ast.Raise(
                            exc=ast.Call(
                                func=ast.Name(id='ValueError', ctx=ast.Load()),
                                args=[
                                    ast.JoinedStr(values=[
                                        ast.Constant(value="数据索引越界（可能是过滤后结果为空）: "),
                                        ast.FormattedValue(
                                            value=ast.Call(
                                                func=ast.Name(id='str', ctx=ast.Load()),
                                                args=[ast.Name(id='e', ctx=ast.Load())],
                                                keywords=[]
                                            ),
                                            conversion=-1
                                        )
                                    ])
                                ],
                                keywords=[]
                            )
                        )
                    ]
                ),
                # KeyError处理
                ast.ExceptHandler(
                    type=ast.Name(id='KeyError', ctx=ast.Load()),
                    name='e',
                    body=[
                        ast.Raise(
                            exc=ast.Call(
                                func=ast.Name(id='ValueError', ctx=ast.Load()),
                                args=[
                                    ast.JoinedStr(values=[
                                        ast.Constant(value="列不存在: "),
                                        ast.FormattedValue(
                                            value=ast.Call(
                                                func=ast.Name(id='str', ctx=ast.Load()),
                                                args=[ast.Name(id='e', ctx=ast.Load())],
                                                keywords=[]
                                            ),
                                            conversion=-1
                                        )
                                    ])
                                ],
                                keywords=[]
                            )
                        )
                    ]
                ),
                # ZeroDivisionError处理
                ast.ExceptHandler(
                    type=ast.Name(id='ZeroDivisionError', ctx=ast.Load()),
                    name=None,
                    body=[
                        ast.Raise(
                            exc=ast.Call(
                                func=ast.Name(id='ValueError', ctx=ast.Load()),
                                args=[ast.Constant(value="除零错误（可能是分组后某组数据为空）")],
                                keywords=[]
                            )
                        )
                    ]
                )
            ],
            orelse=[],
            finalbody=[]
        )
        
        # 替换模块体
        tree.body = [try_node]
        
        # 更新统计
        self._increment_stat('applied_count')
        
        return tree
