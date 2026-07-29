# Sandbox workspace

Files here are mounted into the local gVisor sandbox at `/workspace`.

Use this tree when wiring realtime `@mockmatch/ide` (file tree + terminal).

## Smoke commands (inside the container)

```bash
python3 hello.py
node hello.js
uname -a
dmesg | head   # under runsc → gVisor banner
```
