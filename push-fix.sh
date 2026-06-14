#!/bin/bash
cd /home/ecs-user/.openclaw/workspace/vending-machine

echo "=== 检查文件修改 ==="
grep -A 3 "获取所有日期" src/app/reports/page.tsx

echo ""
echo "=== 添加更改 ==="
git add -A

echo ""
echo "=== 提交更改 ==="
git commit -m "fix: add es2015 target to tsconfig for Set compatibility"

echo ""
echo "=== 推送到 GitHub ==="
git push origin main

echo ""
echo "=== 完成！Vercel 会自动重新构建 ==="