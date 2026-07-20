locals {
  image = var.api_image != "" ? var.api_image : "${digitalocean_container_registry.main.server_url}/${var.project_name}-api:latest"
}

resource "kubernetes_deployment" "api" {
  metadata {
    name      = "api"
    namespace = kubernetes_namespace.app.metadata[0].name
    labels = {
      app  = var.project_name
      tier = "api"
    }
  }

  spec {
    replicas = var.api_replicas

    selector {
      match_labels = {
        app  = var.project_name
        tier = "api"
      }
    }

    template {
      metadata {
        labels = {
          app  = var.project_name
          tier = "api"
        }
      }

      spec {
        termination_grace_period_seconds = 30

        container {
          name  = "api"
          image = local.image

          port {
            name           = "http"
            container_port = 3000
          }

          env {
            name  = "NODE_ENV"
            value = "production"
          }

          env {
            name  = "PORT"
            value = "3000"
          }

          env {
            name  = "OTP_STUB_CODE"
            value = ""
          }

          env {
            name  = "LINKEDIN_REDIRECT_URI"
            value = "https://${var.domain}/auth/oauth/linkedin/callback"
          }

          env_from {
            secret_ref {
              name = "mockmatch-app"
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = "http"
            }
            initial_delay_seconds = 15
            period_seconds        = 20
          }

          readiness_probe {
            http_get {
              path = "/ready"
              port = "http"
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            failure_threshold     = 3
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          security_context {
            run_as_non_root            = true
            allow_privilege_escalation = false
            read_only_root_filesystem  = false
          }
        }
      }
    }
  }

  depends_on = [kubernetes_manifest.external_secret_app]
}

resource "kubernetes_service" "api" {
  metadata {
    name      = "api"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  spec {
    selector = {
      app  = var.project_name
      tier = "api"
    }

    port {
      name        = "http"
      port        = 80
      target_port = "http"
    }

    type = "ClusterIP"
  }
}

resource "kubernetes_deployment" "worker" {
  metadata {
    name      = "worker"
    namespace = kubernetes_namespace.app.metadata[0].name
    labels = {
      app  = var.project_name
      tier = "worker"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app  = var.project_name
        tier = "worker"
      }
    }

    template {
      metadata {
        labels = {
          app  = var.project_name
          tier = "worker"
        }
      }

      spec {
        container {
          name    = "worker"
          image   = local.image
          command = ["npx", "tsx", "src/worker.ts"]

          env {
            name  = "NODE_ENV"
            value = "production"
          }

          env {
            name  = "OTP_STUB_CODE"
            value = ""
          }

          env_from {
            secret_ref {
              name = "mockmatch-app"
            }
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          security_context {
            run_as_non_root            = true
            allow_privilege_escalation = false
          }
        }
      }
    }
  }

  depends_on = [kubernetes_manifest.external_secret_app]
}

resource "kubernetes_horizontal_pod_autoscaler_v2" "api" {
  metadata {
    name      = "api"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  spec {
    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.api.metadata[0].name
    }

    min_replicas = var.api_replicas
    max_replicas = max(var.api_replicas * 3, 6)

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = 70
        }
      }
    }
  }
}
