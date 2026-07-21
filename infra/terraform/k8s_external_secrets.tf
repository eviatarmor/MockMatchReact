resource "helm_release" "external_secrets" {
  name       = "external-secrets"
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  namespace  = "external-secrets"
  version    = "0.12.1"

  create_namespace = true

  set {
    name  = "installCRDs"
    value = "true"
  }

  depends_on = [digitalocean_kubernetes_cluster.main]
}

resource "kubernetes_secret" "gcpsm_sa" {
  metadata {
    name      = "gcpsm-sa"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    "secret-access-credentials" = base64decode(google_service_account_key.eso.private_key)
  }

  type = "Opaque"

  depends_on = [helm_release.external_secrets]
}

resource "kubernetes_manifest" "secret_store" {
  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "SecretStore"
    metadata = {
      name      = "gcp-secret-manager"
      namespace = kubernetes_namespace.app.metadata[0].name
    }
    spec = {
      provider = {
        gcpsm = {
          projectID = var.gcp_project
          auth = {
            secretRef = {
              secretAccessKeySecretRef = {
                name = kubernetes_secret.gcpsm_sa.metadata[0].name
                key  = "secret-access-credentials"
              }
            }
          }
        }
      }
    }
  }

  depends_on = [
    helm_release.external_secrets,
    kubernetes_secret.gcpsm_sa,
  ]
}

resource "kubernetes_manifest" "external_secret_app" {
  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "ExternalSecret"
    metadata = {
      name      = "mockmatch-app"
      namespace = kubernetes_namespace.app.metadata[0].name
    }
    spec = {
      refreshInterval = "1h"
      secretStoreRef = {
        name = "gcp-secret-manager"
        kind = "SecretStore"
      }
      target = {
        name           = "mockmatch-app"
        creationPolicy = "Owner"
      }
      data = [
        {
          secretKey = "DATABASE_URL"
          remoteRef = { key = local.secret_ids.database_url }
        },
        {
          secretKey = "REDIS_URL"
          remoteRef = { key = local.secret_ids.redis_url }
        },
        {
          secretKey = "JWT_ACCESS_SECRET"
          remoteRef = { key = local.secret_ids.jwt_access_secret }
        },
        {
          secretKey = "JWT_REFRESH_SECRET"
          remoteRef = { key = local.secret_ids.jwt_refresh_secret }
        },
        {
          secretKey = "LINKEDIN_CLIENT_ID"
          remoteRef = { key = local.secret_ids.linkedin_client_id }
        },
        {
          secretKey = "LINKEDIN_CLIENT_SECRET"
          remoteRef = { key = local.secret_ids.linkedin_client_secret }
        },
        {
          secretKey = "APP_URL"
          remoteRef = { key = local.secret_ids.app_url }
        },
        {
          secretKey = "API_URL"
          remoteRef = { key = local.secret_ids.api_url }
        },
        {
          secretKey = "STRIPE_SECRET_KEY"
          remoteRef = { key = local.secret_ids.stripe_secret_key }
        },
        {
          secretKey = "STRIPE_WEBHOOK_SECRET"
          remoteRef = { key = local.secret_ids.stripe_webhook_secret }
        },
        {
          secretKey = "STRIPE_PRICE_CREDITS_100"
          remoteRef = { key = local.secret_ids.stripe_price_credits_100 }
        },
        {
          secretKey = "STRIPE_PRICE_CREDITS_500"
          remoteRef = { key = local.secret_ids.stripe_price_credits_500 }
        },
        {
          secretKey = "STRIPE_PRICE_CREDITS_1000"
          remoteRef = { key = local.secret_ids.stripe_price_credits_1000 }
        },
      ]
    }
  }

  depends_on = [kubernetes_manifest.secret_store]
}
