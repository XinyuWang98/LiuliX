"""
核心功能测试
"""
import sys
from liulix_enhancer import CodeEnhancer


def test_array_protection():
    """测试数组索引保护规则 - 最关键的测试"""
    print("=== 测试数组索引保护 ===")
    
    # 测试1: 简单数组访问应该被保护
    code1 = "first = values[0]"
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code1)
    
    assert result['success'], f"增强失败: {result['error']}"
    assert 'if len(values) > 0' in result['code'], "数组保护未生效"
    print("✅ 测试1通过: 简单数组访问被正确保护")
    
    # 测试2: 属性访问不应该被保护（今天的bug修复）
    code2 = "median = df['col'].value_counts().index[0]"
    result2 = enhancer.enhance(code2)
    
    assert result2['success'], f"增强失败: {result2['error']}"
    assert '.index[0]' in result2['code'], "属性访问丢失"
    assert '.((index' not in result2['code'], "错误地保护了属性访问"
    print("✅ 测试2通过: 属性访问不被误伤")
    
    # 测试3: 另一个属性访问case
    code3 = "top_group = grouped.index[0]"
    result3 = enhancer.enhance(code3)
    
    assert result3['success'], f"增强失败: {result3['error']}"
    assert '.index[0]' in result3['code'], "属性访问丢失"
    print("✅ 测试3通过: grouped.index[0]不被误伤")


def test_column_validation():
    """测试列验证"""
    print("\n=== 测试列验证 ===")
    
    code = """
x = df['income']
y = df['age']
"""
    enhancer = CodeEnhancer(columns=['income', 'age'])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    assert 'required_cols' in result['code'], "列验证未生效"
    assert "'income'" in result['code'], "列名缺失"
    print("✅ 列验证测试通过")


def test_empty_check():
    """测试空数据检查"""
    print("\n=== 测试空数据检查 ===")
    
    code = "result = df.mean()"
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    assert 'if len(df) == 0' in result['code'], "空数据检查未生效"
    print("✅ 空数据检查测试通过")


def test_exception_wrap():
    """测试异常捕获"""
    print("\n=== 测试异常捕获 ===")
    
    code = "result = df.mean()"
    enhancer = CodeEnhancer(columns=[])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    assert 'try:' in result['code'], "异常捕获未生效"
    assert 'IndexError' in result['code'], "IndexError处理缺失"
    print("✅ 异常捕获测试通过")


def test_stats():
    """测试统计信息"""
    print("\n=== 测试统计信息 ===")
    
    code = """
values = [1, 2, 3]
first = values[0]
x = df['income']
"""
    enhancer = CodeEnhancer(columns=['income'])
    result = enhancer.enhance(code)
    
    assert result['success'], f"增强失败: {result['error']}"
    assert 'stats' in result, "缺少统计信息"
    print(f"统计信息: {result['stats']}")
    print("✅ 统计信息测试通过")


def main():
    """运行所有测试"""
    print("开始测试 LiuliX Code Enhancer...\n")
    
    try:
        test_array_protection()  # 最关键
        test_column_validation()
        test_empty_check()
        test_exception_wrap()
        test_stats()
        
        print("\n" + "="*50)
        print("✅ 所有测试通过！")
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
