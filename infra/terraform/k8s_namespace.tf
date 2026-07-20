resource "kubernetes_namespace" "app" {
  metadata {
    name = var.project_name
    labels = {
      app         = var.project_name
      environment = var.environment
    }
  }

  depends_on = [digitalocean_kubernetes_cluster.main]
}
