# MockMatch untrusted-code sandbox image.
# Runtime isolation is enforced by docker-compose (network_mode:none, caps, ro rootfs)
# + gVisor runsc. Image is intentionally minimal: no package managers, no net tools.
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    WORKSPACE=/workspace

# Build-time only network. Runtime container has network_mode: none.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    python3 \
    procps \
    tini \
    tree \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  # Strip tools that make sense only with a network / package install surface
  && apt-get purge -y --auto-remove curl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && useradd --create-home --shell /bin/bash --uid 1000 coder \
  && mkdir -p /workspace \
  && chown -R coder:coder /workspace /home/coder \
  # No setuid binaries the guest could abuse (best-effort; gVisor also sandboxes)
  && chmod u-s /usr/bin/passwd /usr/bin/chsh /usr/bin/chfn /usr/bin/newgrp /bin/su /usr/bin/gpasswd 2>/dev/null || true

COPY --chown=coder:coder workspace/ /workspace/
COPY scripts/entrypoint.sh /usr/local/bin/sandbox-entrypoint.sh
RUN chmod 755 /usr/local/bin/sandbox-entrypoint.sh

USER coder
WORKDIR /workspace

# Keep container alive; interact via `docker exec` only (no ttyd / no ports).
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/sandbox-entrypoint.sh"]
