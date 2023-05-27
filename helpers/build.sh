#!/usr/bin/env bash

[[ -v debug ]] && set -x

browser="$1"
MANIFEST="$browser.json"
VERSION=$(sed -nr "s/.*version.*\"([0-9]+\.[0-9]+\.[0-9]+)\".*/\1/p" package.json)
TEMP="tmp"
BUILD_PATH="$TEMP/$browser"
DIST_PATH="dist"
DATE="$(date +'%d-%m-%YT%H:%M:%S:%3N')"
BUILD="$DIST_PATH/${browser}_v${VERSION}_${DATE}.zip"

# Remove existing build directory
[ -d "$BUILD_PATH" ] && rm -rf "$BUILD_PATH"

mkdir -p "$BUILD_PATH"
mkdir -p "$DIST_PATH"

# Copy required files
cp -r action "$BUILD_PATH"
cp -r img "$BUILD_PATH"
cp "manifests/$MANIFEST" "$BUILD_PATH"

sed -r -i'.bak' -e "s/\{\{VERSION\}\}/$VERSION/g" "$BUILD_PATH/$MANIFEST"

# Remove backup file
[ -f "$BUILD_PATH/$MANIFEST.bak" ] && rm "$BUILD_PATH/$MANIFEST.bak"

if ! command -v zip; then
  echo "zip command not found. Please install it to create a zip"
  exit 0
fi

zip -r -FS "$BUILD" "$BUILD_PATH"