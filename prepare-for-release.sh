#!/usr/bin/env bash

set -ex

for i in emulator-run-cmd, install-sdk; do
  (cd $i && npm prune --production && git add node_modules)
done
