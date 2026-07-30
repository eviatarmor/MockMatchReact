# MockMatch untrusted-code sandbox image.
# Guest code runs inside a chroot jail (/opt/jail) via jail-run — not the
# full container rootfs. Runtime: gVisor + network none + cap drop + RO root.
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    WORKSPACE=/workspace \
    JAIL=/opt/jail

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
    coreutils \
    util-linux \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && apt-get purge -y --auto-remove curl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && useradd --create-home --shell /bin/bash --uid 1000 coder \
  && mkdir -p /workspace \
  && chown -R coder:coder /workspace /home/coder \
  # No setuid binaries the guest could abuse (best-effort; gVisor also sandboxes)
  && chmod u-s /usr/bin/passwd /usr/bin/chsh /usr/bin/chfn /usr/bin/newgrp /bin/su /usr/bin/gpasswd 2>/dev/null || true \
  # ── Filesystem jail skeleton (entrypoint bind-mounts /usr RO) ──
  && mkdir -p \
    /opt/jail/usr \
    /opt/jail/etc \
    /opt/jail/tmp \
    /opt/jail/workspace \
    /opt/jail/dev/pts \
    /opt/jail/proc \
    /opt/jail/sys \
    /opt/jail/home \
  # Merged-/usr layout inside jail
  && ln -sfn usr/bin /opt/jail/bin \
  && ln -sfn usr/sbin /opt/jail/sbin \
  && ln -sfn usr/lib /opt/jail/lib \
  && (ln -sfn usr/lib64 /opt/jail/lib64 2>/dev/null || true) \
  && chown root:root /opt/jail \
  && chmod 755 /opt/jail \
  && chown 1000:1000 /opt/jail/workspace

# Minimal guest /etc — no Debian package DB, no real multi-user recon dump
COPY jail-etc/ /opt/jail/etc/
RUN chmod 644 /opt/jail/etc/* \
  && echo sandbox > /opt/jail/etc/debian_version \
  # Linker config must be in jail at build (outer rootfs is RO at runtime)
  && cp -a /etc/ld.so.cache /opt/jail/etc/ld.so.cache \
  && cp -a /etc/ld.so.conf /opt/jail/etc/ld.so.conf \
  && cp -a /etc/ld.so.conf.d /opt/jail/etc/ld.so.conf.d

# Sample files only used by smoke/shell (outer /workspace); sessions mount over jail workspace
COPY --chown=coder:coder workspace/ /workspace/

COPY scripts/entrypoint.sh /usr/local/bin/sandbox-entrypoint.sh
COPY scripts/jail-run.sh /usr/local/bin/jail-run
RUN chmod 755 /usr/local/bin/sandbox-entrypoint.sh /usr/local/bin/jail-run

# Entrypoint must be root to bind-mount jail (then sleep). Guest uses jail-run.
USER root
WORKDIR /opt/jail/workspace

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/sandbox-entrypoint.sh"]
