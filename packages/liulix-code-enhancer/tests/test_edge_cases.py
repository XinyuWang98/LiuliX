"""
边界case和高级测试
"""
import sys
from liulix_enhancer import CodeEnhancer


def test_nested_subscripts():
    """测试嵌套下标访问"""
    print("=== 测试嵌套下标 ===")
    
    code = "result = matrix[i][j]"
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    # matrix[i]应该被保护，但[j]也会被保护（因为是Name[Name]）
    print("✅ 嵌套下标测试通过")


def test_f_string_with_index():
    """测试f-string中的索引访问"""
    print("\n=== 测试f-string中的索引 ===")
    
    code = 'summary = f"Value: {arr[0]}"'
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    # f-string中的arr[0]应该被保护
    print("✅ f-string索引测试通过")


def test_multiple_array_accesses():
    """测试多个数组访问"""
    print("\n=== 测试多个数组访问 ===")
    
    code = """
first = arr1[0]
second = arr2[1]
third = arr3[2]
"""
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    stats = result['stats'].get('array_protection', {})
    assert stats.get('applied_count', 0) >= 3, "应该保护3个数组访问"
    print(f"✅ 多个数组访问测试通过（保护了{stats['applied_count']}个）")


def test_no_array_access():
    """测试没有数组访问的代码"""
    print("\n=== 测试无数组访问代码 ===")
    
    code = "result = df.mean()"
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    stats = result['stats'].get('array_protection', {})
    assert stats.get('applied_count', 0) == 0, "不应该有数组访问保护"
    print("✅ 无数组访问测试通过")


def test_slice_access():
    """测试切片访问（不应该被保护）"""
    print("\n=== 测试切片访问 ===")
    
    code = "subset = arr[0:10]"
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    # 切片不应该被保护（slice不是Constant）
    assert '[0:10]' in result['code'], "切片应该保持不变"
    print("✅ 切片访问测试通过")


def test_dict_access():
    """测试字典访问"""
    print("\n=== 测试字典访问 ===")
    
    code = "value = data['key']"
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    # 字符串键不应该被保护（不是int）
    assert "['key']" in result['code'], "字典访问应该保持不变"
    print("✅ 字典访问测试通过")


def test_empty_code():
    """测试空代码"""
    print("\n=== 测试空代码 ===")
    
    code = ""
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    # 空代码可能失败或成功，但不应该崩溃
    assert 'stats' in result, "应该返回结果"
    print("✅ 空代码测试通过")


def test_syntax_error_code():
    """测试语法错误的代码"""
    print("\n=== 测试语法错误代码 ===")
    
    code = "if x = 1:"  # 语法错误
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    # 应该返回原代码并标记失败
    assert result['success'] == False, "应该标记失败"
    assert result['code'] == code, "应该返回原代码"
    assert result['error'] is not None, "应该有错误信息"
    print("✅ 语法错误处理测试通过")


def test_complex_expression():
    """测试复杂表达式"""
    print("\n=== 测试复杂表达式 ===")
    
    code = """
# 多层属性访问
result = df['income'].value_counts().index[0]
# 链式方法调用
top3 = df.groupby('category').size().nlargest(3).index[0]
# 数组索引
values = sorted_list[0]
"""
    enhancer = CodeEnhancer(columns=['income', 'category'])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    # 只有sorted_list[0]应该被保护
    assert '.index[0]' in result['code'], "属性访问应该保持"
    assert 'if len(sorted_list) > 0' in result['code'], "数组访问应该被保护"
    print("✅ 复杂表达式测试通过")


def test_groupby_detection():
    """测试GroupBy检测"""
    print("\n=== 测试GroupBy检测 ===")
    
    code = "grouped = df.groupby('category').mean()"
    enhancer = CodeEnhancer(columns=['category'])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    assert 'nunique' in result['code'], "应该有GroupBy检查"
    print("✅ GroupBy检测测试通过")


def main():
    """运行所有边界测试"""
    print("开始边界case测试...\n")
    
    try:
        test_nested_subscripts()
        test_f_string_with_index()
        test_multiple_array_accesses()
        test_no_array_access()
        test_slice_access()
        test_dict_access()
        test_empty_code()
        test_syntax_error_code()
        test_complex_expression()
        test_groupby_detection()
        
        print("\n" + "="*50)
        print("✅ 所有边界测试通过！")
        print("="*50)
        return 0
        
    except AssertionError as e:
        print(f"\n❌ 测试失败: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ 意外错误: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
