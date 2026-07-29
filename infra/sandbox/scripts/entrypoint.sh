#!/usr/bin/env bash
set -euo pipefail

# Untrusted-code sandbox: no network, no services listening.
# Host / IDE control plane uses: docker exec -it mockmatch-sandbox bash
#
# Stay alive so the container remains available for exec sessions.
exec sleep infinity
