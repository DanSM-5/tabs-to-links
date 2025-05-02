#!/usr/bin/env bash

set -e

# Loop in manifests for supported browsers
# and create a build per each one.
for file in manifests/*; do
  filename="$(basename "$file")"
  helpers/build.sh "${filename%.json}"
done
