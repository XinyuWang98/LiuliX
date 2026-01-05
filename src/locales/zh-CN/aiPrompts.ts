// AI Prompts 中文翻译
export const aiPrompts = {
    router: {
        insight: {
            systemRole: "你是一位资深数据分析专家。",
            taskDescription: "请根据数据集特征,从【可用分析模板】中选择 3-5 个最有价值的分析视角。",
            datasetInfo: "数据集信息",
            columnInfo: "列信息",
            sampleData: "采样数据",
            availableTemplates: "可用分析模板",
            requirements: "任务要求",
            outputFormat: "输出格式 (严格 JSON)",
            constraints: "重要约束（3B模型优化）",
            fewShotIntro: "Few-shot示例",
            fewShotCorrect: "正确输出:",
            fewShotNow: "**现在请分析实际数据并生成推荐。**"
        },
        cleaning: {
            systemRole: "你是数据清洗专家。",
            taskDescription: "请根据数据质量问题,从【可用清洗模板】中选择2-5个最合适的。",
            qualityIssues: "数据质量问题",
            columnInfo: "列信息（前10列）",
            availableTemplates: "可用清洗模板",
            requirements: "任务要求",
            outputFormat: "输出格式 (严格JSON)",
            constraints: "重要约束"
        }
    }
};
