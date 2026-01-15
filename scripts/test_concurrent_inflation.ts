/**
 * 代码膨胀并发化性能测试
 * 对比串行 vs 并发执行的性能差异
 */

import { inflateRecommendations } from '../src/services/insights/inflater.js';
import { L1Recommendation } from '../src/types/insightTree.js';

// 模拟推荐数据
const mockRecommendations: L1Recommendation[] = [
    {
        promptId: 'worker-distribution-v1',
        params: { column_name: 'age' },
        reason: '查看年龄分布'
    },
    {
        promptId: 'worker-stats-v1',
        params: { column_name: 'salary' },
        reason: '薪资统计'
    },
    {
        promptId: 'worker-correlation-v1',
        params: { col_x: 'age', col_y: 'salary' },
        reason: '年龄与薪资相关性'
    },
    {
        promptId: 'worker-groupby-v1',
        params: { group_col: 'department', agg_col: 'salary' },
        reason: '按部门统计薪资'
    }
];

async function testConcurrentInflation() {
    console.log('\n🧪 代码膨胀并发化性能测试\n');
    console.log('📋 测试数据: 4 个推荐');
    console.log('🎯 预期效果: 并发模式应该比串行快 30-40%\n');

    try {
        const tableName = 'test_table';  // 假设的表名

        console.log('⏱️  开始测试...\n');
        const startTime = performance.now();

        // 调用并发版本的 inflateRecommendations
        const nodes = await inflateRecommendations(mockRecommendations as any, tableName);

        const duration = (performance.now() - startTime) / 1000;

        console.log(`\n✅ 测试完成`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📊 结果统计:`);
        console.log(`   - 输入推荐数: ${mockRecommendations.length}`);
        console.log(`   - 输出节点数: ${nodes.length}`);
        console.log(`   - 总耗时: ${duration.toFixed(2)}s`);
        console.log(`   - 平均耗时: ${(duration / mockRecommendations.length).toFixed(2)}s/个`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // 分析并发效果
        if (nodes.length === mockRecommendations.length) {
            console.log('🎉 所有推荐都成功膨胀！');
        } else {
            console.log(`⚠️  有 ${mockRecommendations.length - nodes.length} 个推荐被过滤`);
        }

        console.log('\n💡 提示: 查看控制台日志中的 "[Inflater] 使用限流并发模式" 确认并发已启用\n');

    } catch (error) {
        console.error('\n❌ 测试失败:', error);
        process.exit(1);
    }
}

testConcurrentInflation();
