#!/bin/bash

# Fix: Batch create English versions and index routers for remaining prompts

set -e

# Mapping: prompt_name → Title → Description → CamelCaseName
PROMPTS=(
  "worker_missing:Missing Value Analysis:Scan all columns and analyze missing data patterns, calculate missing counts and percentages:workerMissingPrompt"
  "worker_crosstab:Crosstab Analysis:Create cross-tabulation between two categorical variables, show frequency distribution:workerCrosstabPrompt"
  "worker_clean_dedup:Remove Duplicates:Identify and remove duplicate rows based on specified columns:workerCleanDedupPrompt"
  "worker_clean_fillna:Fill Missing Values:Fill missing values using mean, median, mode, or custom value:workerCleanFillnaPrompt"
  "worker_clean_dropna:Drop Missing Values:Remove rows or columns with missing values based on threshold:workerCleanDropnaPrompt"
  "worker_clean_outlier:Clean Outliers:Detect and handle outliers using IQR or Z-score method:workerCleanOutlierPrompt"
  "worker_clean_normalize:Normalize Data:Normalize numeric columns using min-max or z-score normalization:workerCleanNormalizePrompt"
  "worker_clean_typecast:Type Conversion:Convert column data types (string to numeric, date parsing, etc.):workerCleanTypecastPrompt"
  "worker_regression:Regression Analysis:Perform linear or logistic regression analysis:workerRegressionPrompt"
  "worker_decision_tree:Decision Tree:Build decision tree classifier or regressor:workerDecisionTreePrompt"
  "worker_cluster:Clustering Analysis:Perform K-means or hierarchical clustering:workerClusterPrompt"
)

BASE_DIR="src/services/prompts/library/l2"

for prompt_info in "${PROMPTS[@]}"; do
  IFS=':' read -r prompt_name title_en description_en const_name <<< "$prompt_info"
  
  DIR="$BASE_DIR/$prompt_name"
  EN_FILE="$DIR/${prompt_name}.en.ts"
  INDEX_FILE="$DIR/index.ts"
  
  # Convert to PascalCase for function name
  pascal_name=$(echo "$const_name" | sed 's/Prompt$//')
  func_name="get${pascal_name}Prompt"
  
  echo "Creating $prompt_name ($const_name)..."
  
  # Create English version
  cat > "$EN_FILE" << EOF
/**
 * ${pascal_name} Prompt - English Version
 */

import { UserPrompt } from '@/types/prompt';

export const $const_name: UserPrompt = {
    id: '$prompt_name-v1',
    name: '$prompt_name',
    title: '$title_en',
    description: '$description_en',
    
    slug: '$prompt_name-v1',
    packageId: 'basic',
    requiredPackages: ['pandas', 'numpy'],
    outputCharts: ['chart'],
    layer: 'L2_EXECUTION',
    
    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'analysis', label: 'Analysis' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],
    
    template: \`
You are a professional data analyst.
[English prompt template]

# Dataset Summary
{{df_summary}}

# Requirements
1. Perform $title_en
2. Return JSON format result

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "Analysis summary in English",
  "columnsUsed": []
}
\`,
    
    inputVariables: ['df_summary'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
EOF

  # Create index router
  cat > "$INDEX_FILE" << EOF
/**
 * ${pascal_name} Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './${prompt_name}.en';
import * as promptZh from './${prompt_name}.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function $func_name(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].$const_name;
}

export const $const_name: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = $func_name();
        return prompt[prop as keyof UserPrompt];
    }
});
EOF

done

echo "✅ All files created successfully!"
