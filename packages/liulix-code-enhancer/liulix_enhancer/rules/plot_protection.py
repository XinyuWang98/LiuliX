"""
绘图数据检查规则
在 Pandas 风格的绘图调用前注入空数据检查（排除 matplotlib Axes 方法）
"""
import ast
import copy
from .base import EnhancementRule

class PlotProtectionRule(EnhancementRule):
    """
    检测 Pandas 绘图调用并在其前注入空数据检查。
    
    支持的模式：
    1. df['col'].hist() - Subscript 调用者
    2. df['col'].dropna().plot() - 链式调用中有 Subscript
    3. grouped.plot.bar() - .plot.xxx() 模式
    4. df.plot.scatter(x='a', y='b') - DataFrame 的 plot accessor
    """
    
    # Pandas 绘图方法
    PANDAS_PLOT_METHODS = {'plot', 'hist', 'boxplot', 'bar', 'barh', 'pie', 'area', 'line', 'scatter', 'kde', 'density'}
    
    def __init__(self):
        super().__init__()
        self._applied = False
    
    @property
    def name(self) -> str:
        return 'plot_protection'
    
    def apply(self, tree: ast.AST) -> ast.AST:
        """应用规则"""
        transformer = PlotTransformer(self.PANDAS_PLOT_METHODS)
        new_tree = transformer.visit(tree)
        
        # 处理 transformer 可能返回列表的情况
        if isinstance(new_tree, ast.Module):
            new_body = []
            for item in new_tree.body:
                if isinstance(item, list):
                    new_body.extend(item)
                else:
                    new_body.append(item)
            new_tree.body = new_body
        
        if transformer.applied_count > 0:
            self._increment_stat('applied_count')
        
        return new_tree

class PlotTransformer(ast.NodeTransformer):
    def __init__(self, plot_methods):
        super().__init__()
        self.plot_methods = plot_methods
        self.applied_count = 0

    def visit_Expr(self, node):
        self.generic_visit(node)
        
        data_source = self._extract_pandas_data_source(node.value)
        if data_source:
            check = self._create_check(data_source)
            if check:
                self.applied_count += 1
                return [check, node]
        return node
        
    def visit_Assign(self, node):
        self.generic_visit(node)
        
        data_source = self._extract_pandas_data_source(node.value)
        if data_source:
            check = self._create_check(data_source)
            if check:
                self.applied_count += 1
                return [check, node]
        return node

    def _extract_pandas_data_source(self, node):
        """
        从 Pandas 风格的绘图调用中提取数据源。
        
        支持的模式：
        1. df['col'].hist() → df['col']
        2. df['col'].dropna().plot() → df['col'].dropna()
        3. grouped.plot.bar() → grouped (检测 .plot.xxx() 模式)
        4. df.plot.scatter(x='a', y='b') → df
        """
        if not isinstance(node, ast.Call):
            return None
        
        if not isinstance(node.func, ast.Attribute):
            return None
            
        method_name = node.func.attr
        
        # 模式1: 直接的绘图方法调用，如 df['col'].hist()
        if method_name in self.plot_methods and method_name != 'plot':
            caller = node.func.value
            
            # 检查是不是 .plot.xxx() 模式（如 grouped.plot.bar()）
            if isinstance(caller, ast.Attribute) and caller.attr == 'plot':
                # 这是 .plot.xxx() 模式，数据源是 .plot 之前的部分
                return caller.value
            
            # 检查调用者是否是 Subscript 或包含 Subscript 的链
            if isinstance(caller, ast.Subscript):
                return caller
            inner = self._find_innermost_subscript(caller)
            if inner:
                return caller
        
        # 模式2: .plot() 直接调用，如 df.plot() 或 grouped.plot()
        if method_name == 'plot':
            caller = node.func.value
            
            # 检查调用者是否是 Subscript
            if isinstance(caller, ast.Subscript):
                return caller
            
            # 检查调用者是否是 Name (变量，如 grouped)
            # 但排除 plt.plot() 这种 matplotlib 调用
            if isinstance(caller, ast.Name) and caller.id not in ('plt', 'ax', 'axes', 'fig', 'figure'):
                return caller
            
            # 检查链式调用中是否有 Subscript
            inner = self._find_innermost_subscript(caller)
            if inner:
                return caller
        
        return None
    
    def _find_innermost_subscript(self, node):
        """递归查找链式调用中是否存在 Subscript"""
        if isinstance(node, ast.Subscript):
            return node
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            return self._find_innermost_subscript(node.func.value)
        if isinstance(node, ast.Attribute):
            return self._find_innermost_subscript(node.value)
        return None

    def _create_check(self, data_source_node):
        """创建检查代码 AST"""
        target_copy = copy.deepcopy(data_source_node)
        
        len_call = ast.Call(
            func=ast.Name(id='len', ctx=ast.Load()),
            args=[target_copy],
            keywords=[]
        )
        
        msg = "绘图被拦截: 检测到数据为空 (len=0)。请检查过滤条件或数据加载。"
        
        raise_node = ast.Raise(
            exc=ast.Call(
                func=ast.Name(id='ValueError', ctx=ast.Load()),
                args=[ast.Constant(value=msg)],
                keywords=[]
            ),
            cause=None
        )
        
        check_node = ast.If(
            test=ast.Compare(
                left=len_call,
                ops=[ast.Eq()],
                comparators=[ast.Constant(value=0)]
            ),
            body=[raise_node],
            orelse=[]
        )
        
        return check_node



