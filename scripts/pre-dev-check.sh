#!/bin/sh
# LiuliX Pre-dev Hook: 启动前完整检查

# 运行全局规则检查
sh scripts/check-rules.sh

# 检查是否通过
if [ $? -ne 0 ]; then
  exit 1
fi

exit 0
