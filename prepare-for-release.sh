#!/usr/bin/env bash

set -ex

for i in emulator-run-cmd install-sdk; do
  (cd $i && npm install && npm run build && npm prune --production && git add -f node_modules lib)
done
