#!/bin/zsh
# 把 App 装到连着的 iPhone 上（个人免费 Apple ID 签名，7 天后需重装）
# 用法：npm run ios:device            （自动选第一台连接的 iPhone）
#       npm run ios:device -- <UDID>
set -e
export LANG=en_US.UTF-8
cd "$(dirname "$0")/.."
DEVICE="${1:-$(xcrun xctrace list devices 2>/dev/null | awk '/== Simulators ==/{exit} /\(000/{match($0,/\(0000[0-9A-F-]+\)/); print substr($0,RSTART+1,RLENGTH-2); exit}')}"
[ -z "$DEVICE" ] && { echo "没有找到连接的 iPhone，请用数据线连上并解锁"; exit 1; }
npx expo prebuild --platform ios >/dev/null
# 个人团队没有推送权限：去掉 aps-environment（本地提醒不受影响）
/usr/libexec/PlistBuddy -c "Delete :aps-environment" ios/app/app.entitlements 2>/dev/null || true
BUNDLE_ID=com.luckyyoustudio.luckybaby
# 直接用 xcodebuild：允许自动生成描述文件（expo run:ios 不会传这个参数）
xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Release \
  -destination "id=$DEVICE" -derivedDataPath ios/build -allowProvisioningUpdates build | grep -E "error:|warning: .*signing|BUILD|Signing Identity" || true
APP=ios/build/Build/Products/Release-iphoneos/app.app
[ -d "$APP" ] || { echo "编译失败，没有生成 $APP"; exit 1; }
xcrun devicectl device install app --device "$DEVICE" "$APP"
xcrun devicectl device process launch --device "$DEVICE" "$BUNDLE_ID"
echo "已安装并启动：幸运宝贝"
