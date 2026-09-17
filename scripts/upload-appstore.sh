#!/bin/zsh
# 打包并上传到 App Store Connect（付费团队自动签名）
# 用法：npm run ios:upload   —— 约 10–15 分钟；上传后在 ASC 等待处理
set -e
export LANG=en_US.UTF-8
cd "$(dirname "$0")/.."
npx expo prebuild --platform ios >/dev/null
rm -rf ios/archive
xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Release -destination "generic/platform=iOS" \
  -archivePath ios/archive/app.xcarchive -allowProvisioningUpdates archive | grep -E "error:|ARCHIVE|Signing Identity" || true
[ -d ios/archive/app.xcarchive ] || { echo "归档失败"; exit 1; }
xcodebuild -exportArchive -archivePath ios/archive/app.xcarchive -exportOptionsPlist ios-export/ExportOptions.plist -exportPath ios/archive/export -allowProvisioningUpdates | grep -E "error:|EXPORT|Upload" || true
echo "已上传，去 App Store Connect 等构建处理完成"
