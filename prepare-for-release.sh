#!/usr/bin/env bash

set -ex

for i in emulator-run-cmd install-sdk; do
  (cd $i && docker run -t -v $(pwd):/opt/app -w /opt/app node:16 bash -c 'npm install && npm run build && npm prune --production' && git add -f node_modules lib)
done
