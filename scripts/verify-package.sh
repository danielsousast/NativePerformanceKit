#!/bin/sh
# Packs the library and installs the tarball into an empty project, checks the shipped
# files, and typechecks a consumer against the published types.
set -e
root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cd "$root"
yarn workspace react-native-performance-kit prepare
(cd packages/react-native-performance-kit && yarn pack -o "$work/pkg.tgz")

mkdir "$work/consumer"
cd "$work/consumer"
npm init -y >/dev/null
npm install --ignore-scripts --no-audit --no-fund "$work/pkg.tgz" react@19.3.0 react-native@0.88.1 \
  typescript@6.0.3 @types/react@19.3.0 >/dev/null

pkg=node_modules/react-native-performance-kit
for f in package.json lib/module/index.js lib/typescript/src/index.d.ts android/build.gradle \
  android/src/main ios/PerformanceKit.mm ios/MemoryCollector.swift PerformanceKit.podspec src/index.tsx; do
  [ -e "$pkg/$f" ] || { echo "missing from package: $f"; exit 1; }
done
for f in android/src/test ios/Tests src/__tests__; do
  [ ! -e "$pkg/$f" ] || { echo "test files shipped in package: $f"; exit 1; }
done

cat > consumer.tsx <<'TS'
import {
  PerformanceKitError,
  getSnapshot,
  startMonitoring,
  stopMonitoring,
  usePerformanceMonitor,
  type PerformanceSnapshot,
} from 'react-native-performance-kit';

export async function run(): Promise<PerformanceSnapshot['fps']> {
  try {
    await startMonitoring({ intervalMs: 500 });
    const snapshot: PerformanceSnapshot = await getSnapshot();
    await stopMonitoring();
    return snapshot.fps;
  } catch (e) {
    if (e instanceof PerformanceKitError) return null;
    throw e;
  }
}

export function useIt() {
  return usePerformanceMonitor({ intervalMs: 1000, enabled: true });
}
TS
npx tsc --noEmit --strict --skipLibCheck --jsx react-jsx --module esnext --moduleResolution bundler \
  --target es2022 --types react consumer.tsx
echo "package verified"
