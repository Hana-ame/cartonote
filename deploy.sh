#!/usr/bin/env bash
# 一键部署到 GitHub Pages（gh-pages 分支）
# 用法: ./deploy.sh ["提交说明"]
set -e
cd "$(dirname "$0")"

echo "==> 安装依赖"
npm ci || npm install

echo "==> 构建"
npm run build

echo "==> 发布到 gh-pages"
rm -rf .pages-tmp && mkdir -p .pages-tmp
cp -r dist/. .pages-tmp/
touch .pages-tmp/.nojekyll
cd .pages-tmp
git init -q -b gh-pages
git add -A
git -c core.autocrlf=false commit -q -m "${1:-Deploy to GitHub Pages}"
git push -f origin gh-pages 2>/dev/null || {
  git remote add origin https://github.com/Hana-ame/cartonote.git
  git push -f origin gh-pages
}
cd .. && rm -rf .pages-tmp
echo "==> 完成: https://hana-ame.github.io/cartonote/"
