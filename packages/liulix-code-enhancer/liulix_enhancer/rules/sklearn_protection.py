"""
Sklearn 模型保护规则
在 sklearn 模型的 .fit() 调用前注入数据为空检查
"""
import ast
import copy
from .base import EnhancementRule

class SklearnProtectionRule(EnhancementRule):
    """
    检测 sklearn 模型的 .fit() 调用并在其前注入数据为空检查。
    
    错误示例：
    ValueError: Found array with 0 sample(s) (shape=(0, 3)) 
    while a minimum of 1 is required by DecisionTreeClassifier.
    
    支持的模式：
    1. model.fit(X, y) - 模型训练
    2. clf.fit(X_train, y_train) - 分类器训练
    """
    
    def __init__(self):
        super().__init__()
        self._applied = False
    
    @property
    def name(self) -> str:
        return 'sklearn_protection'
    
    def apply(self, tree: ast.AST) -> ast.AST:
        """应用规则"""
        transformer = SklearnTransformer()
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

class SklearnTransformer(ast.NodeTransformer):
    # sklearn 常见的训练方法
    FIT_METHODS = {'fit', 'fit_transform', 'fit_predict'}
    
    def __init__(self):
        super().__init__()
        self.applied_count = 0

    def visit_Expr(self, node):
        self.generic_visit(node)
        
        data_arg = self._extract_fit_data(node.value)
        if data_arg:
            check = self._create_check(data_arg)
            if check:
                self.applied_count += 1
                return [check, node]
        return node
        
    def visit_Assign(self, node):
        self.generic_visit(node)
        
        data_arg = self._extract_fit_data(node.value)
        if data_arg:
            check = self._create_check(data_arg)
            if check:
                self.applied_count += 1
                return [check, node]
        return node

    def _extract_fit_data(self, node):
        """
        从 .fit() 调用中提取第一个数据参数（X）。
        
        模式：model.fit(X, y) 或 model.fit(X)
        """
        if not isinstance(node, ast.Call):
            return None
        
        if not isinstance(node.func, ast.Attribute):
            return None
            
        method_name = node.func.attr
        
        # 检测 fit 系列方法
        if method_name not in self.FIT_METHODS:
            return None
        
        # 检查是否有位置参数（第一个参数是 X）
        if node.args and len(node.args) >= 1:
            first_arg = node.args[0]
            # 只对变量名或属性调用进行检查（避免对复杂表达式重复求值）
            if isinstance(first_arg, (ast.Name, ast.Subscript, ast.Attribute)):
                return first_arg
        
        # 检查是否有关键字参数 X=...
        for keyword in node.keywords:
            if keyword.arg == 'X':
                if isinstance(keyword.value, (ast.Name, ast.Subscript, ast.Attribute)):
                    return keyword.value
        
        return None

    def _create_check(self, data_node):
        """创建检查代码 AST"""
        target_copy = copy.deepcopy(data_node)
        
        len_call = ast.Call(
            func=ast.Name(id='len', ctx=ast.Load()),
            args=[target_copy],
            keywords=[]
        )
        
        msg = "模型训练被拦截: 检测到训练数据为空 (len=0)。请检查数据过滤或特征提取。"
        
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
