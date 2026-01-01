#!/bin/sh
# LiuliX 全局规则自检程序
# 基于 docs/00-必读/00-全局规则.md 的21条铁律

echo "🔍 LiuliX 启动前自检..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 统计变量
P0_ERRORS=0
P1_WARNINGS=0

# ============================================
# P0 阻塞级检查（必须通过才能启动）
# ============================================

echo "🚨 [P0] 高风险操作检测..."
# 新增：检测是否有删除文件操作
DELETED_FILES=$(git status --porcelain 2>/dev/null | grep "^ D\|^D " | wc -l | tr -d ' ')
if [ "$DELETED_FILES" -gt "0" ]; then
  echo "❌ 检测到 $DELETED_FILES 个文件被删除！"
  git status --porcelain 2>/dev/null | grep "^ D\|^D "
  echo ""
  echo "⚠️  删除操作需要人工确认，禁止自动启动。"
  echo "   如果确认删除是正确的，请先 git add/commit 后再启动。"
  P0_ERRORS=$((P0_ERRORS + 1))
else
  echo "✅ 无高风险删除操作"
fi
echo ""

echo "🔐 [P0] 类型定义变更检测..."
# 检测类型定义文件是否被修改
TYPE_CHANGES=$(git diff --name-only 2>/dev/null | grep -E "types/.*\.ts$" | wc -l | tr -d ' ')
if [ "$TYPE_CHANGES" -gt "0" ]; then
  echo "⚠️  检测到类型定义文件被修改："
  git diff --name-only 2>/dev/null | grep -E "types/.*\.ts$"
  echo ""
  echo "   类型定义变更需要人工审核。"
  echo "   如果确认变更是正确的，请先 git add/commit 后再启动。"
  P0_ERRORS=$((P0_ERRORS + 1))
else
  echo "✅ 类型定义未被修改"
fi
echo ""

echo "📋 [P0] TypeScript 类型检查..."
if ! npm run type-check > /dev/null 2>&1; then
  echo "❌ TypeScript 类型错误"
  # 显示错误数量
  ERROR_COUNT=$(npm run type-check 2>&1 | grep "Found.*errors" | tail -1)
  echo "   $ERROR_COUNT"
  echo ""
  echo "   请修复错误后再启动（禁止通过删除文件来规避）"
  P0_ERRORS=$((P0_ERRORS + 1))
else
  echo "✅ TypeScript 类型检查通过"
fi
echo ""

# ============================================
# P1 警告级检查（不阻塞启动，但需关注）
# ============================================

echo "🎨 [P1] CSS 变量强制化检查..."
# 规则1: 禁止硬编码颜色（排除.css文件和注释）
HARDCODED_COLORS=$(grep -rn --include="*.tsx" --include="*.ts" -E "rgba?\(|#[0-9A-Fa-f]{3,6}[^a-zA-Z]" src/ 2>/dev/null | grep -v "var(" | grep -v "//" | wc -l | tr -d ' ')
if [ "$HARDCODED_COLORS" -gt "0" ]; then
  echo "⚠️  发现 $HARDCODED_COLORS 处硬编码颜色（违反规则1）"
  P1_WARNINGS=$((P1_WARNINGS + 1))
else
  echo "✅ 无硬编码颜色"
fi
echo ""

echo "🚫 [P1] 内联样式检查..."
# 规则5: 禁止内联 style
INLINE_STYLES=$(grep -rn --include="*.tsx" 'style={{' src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$INLINE_STYLES" -gt "0" ]; then
  echo "⚠️  发现 $INLINE_STYLES 处内联样式（违反规则5）"
  P1_WARNINGS=$((P1_WARNINGS + 1))
else
  echo "✅ 无内联样式"
fi
echo ""

echo "📝 [P1] 日志规范检查..."
# 规则15: 禁止裸 console.log
CONSOLE_LOGS=$(grep -rn --include="*.tsx" --include="*.ts" "console\.log" src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -gt "0" ]; then
  echo "⚠️  发现 $CONSOLE_LOGS 处裸 console.log（违反规则15）"
  P1_WARNINGS=$((P1_WARNINGS + 1))
else
  echo "✅ 日志规范符合"
fi
echo ""

echo "🔤 [P1] 字体规范检查..."
# 规则19: 禁止硬编码字体
HARDCODED_FONTS=$(grep -rn --include="*.css" --include="*.tsx" "font-family:" src/ 2>/dev/null | grep -v "var(" | wc -l | tr -d ' ')
if [ "$HARDCODED_FONTS" -gt "0" ]; then
  echo "⚠️  发现 $HARDCODED_FONTS 处硬编码字体（违反规则19）"
  P1_WARNINGS=$((P1_WARNINGS + 1))
else
  echo "✅ 字体规范符合"
fi
echo ""

echo "🚫 [P1] ts-ignore 检查..."
# 检查是否有 @ts-ignore 或 @ts-nocheck
TS_IGNORE=$(grep -rn --include="*.tsx" --include="*.ts" "@ts-ignore\|@ts-nocheck" src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$TS_IGNORE" -gt "0" ]; then
  echo "⚠️  发现 $TS_IGNORE 处 @ts-ignore/nocheck（违反规则22）"
  P1_WARNINGS=$((P1_WARNINGS + 1))
else
  echo "✅ 无 ts-ignore 规避"
fi
echo ""

# ============================================
# 检查结果汇总
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 检查结果汇总："
echo "   P0 阻塞错误: $P0_ERRORS"
echo "   P1 警告: $P1_WARNINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$P0_ERRORS" -gt "0" ]; then
  echo "❌ 发现 P0 级错误，禁止启动开发服务器！"
  echo ""
  echo "   请先修复上述错误后重试。"
  echo "   ⚠️  禁止通过删除文件、修改类型定义、添加 ts-ignore 来规避！"
  echo ""
  exit 1
fi

if [ "$P1_WARNINGS" -gt "0" ]; then
  echo "⚠️  存在 $P1_WARNINGS 个 P1 级警告（不阻塞启动）"
  echo "   建议在后续迭代中修复。"
  echo ""
fi

echo "✅ 全局规则检查通过，允许启动！"
echo ""
exit 0
