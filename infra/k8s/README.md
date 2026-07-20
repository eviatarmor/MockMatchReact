# Kubernetes manifests (reference)

Primary provisioning is **Terraform** under `infra/terraform/` (DOKS + Helm + External Secrets).

This folder documents conventions for Phase B WebSocket workload and manual `kubectl` overrides.

## Workloads

| Deployment | Role | Scale |
|------------|------|--------|
| `api` | Hono/tRPC REST — **stateless** | HPA on CPU |
| `worker` | BullMQ consumers | fixed / queue depth later |
| `ws` (future) | WebSockets + Redis adapter | HPA on CPU/connections |

## Stateless rules

- No pod-local session state
- OTP + refresh hashes → Redis
- Users / oauth_accounts → Postgres
- Secrets → GCP Secret Manager via External Secrets Operator (`mockmatch-app` Secret)

## Future `ws` Deployment sketch

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ws
  namespace: mockmatch
spec:
  replicas: 2
  selector:
    matchLabels:
      tier: ws
  template:
    metadata:
      labels:
        tier: ws
    spec:
      containers:
        - name: ws
          image: registry.digitalocean.com/mockmatch-prod/mockmatch-api:latest
          command: ["npx", "tsx", "src/ws.ts"]  # not implemented yet
          ports:
            - containerPort: 3001
          envFrom:
            - secretRef:
                name: mockmatch-app
```

Ingress path `/ws` → Service `ws` with nginx websocket annotations (timeouts already set on controller).
