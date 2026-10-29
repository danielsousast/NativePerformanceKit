#!/bin/sh
# Compiles the collector with its XCTest cases for macOS and runs them (no Xcode project needed).
set -e
platform="$(xcrun --show-sdk-platform-path)/Developer"
dir="$(cd "$(dirname "$0")" && pwd)"
out="$(mktemp -d)"
bundle="$out/MemoryCollectorTests.xctest"
mkdir -p "$bundle/Contents/MacOS"
xcrun swiftc -module-name MemoryCollectorTests -emit-library -o "$bundle/Contents/MacOS/MemoryCollectorTests" \
  -Xlinker -bundle -parse-as-library -F "$platform/Library/Frameworks" -I "$platform/usr/lib" -L "$platform/usr/lib" \
  -Xlinker -rpath -Xlinker "$platform/Library/Frameworks" -Xlinker -rpath -Xlinker "$platform/usr/lib" \
  -framework XCTest "$dir/../MemoryCollector.swift" "$dir/MemoryCollectorTests.swift"
cat > "$bundle/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>MemoryCollectorTests</string>
<key>CFBundleIdentifier</key><string>dev.performancekit.MemoryCollectorTests</string>
<key>CFBundlePackageType</key><string>BNDL</string>
</dict></plist>
PLIST
xcrun xctest "$bundle"
