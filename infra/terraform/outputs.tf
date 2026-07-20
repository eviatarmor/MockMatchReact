output "vpc_id" {
  value = digitalocean_vpc.main.id
}

output "doks_cluster_id" {
  value = digitalocean_kubernetes_cluster.main.id
}

output "doks_cluster_name" {
  value = digitalocean_kubernetes_cluster.main.name
}

output "docr_endpoint" {
  value = digitalocean_container_registry.main.server_url
}

output "postgres_private_host" {
  value     = digitalocean_database_cluster.postgres.private_host
  sensitive = true
}

output "valkey_private_host" {
  value     = digitalocean_database_cluster.valkey.private_host
  sensitive = true
}

output "gcp_secret_ids" {
  description = "Secret Manager secret ids for app config"
  value       = local.secret_ids
}

output "linkedin_redirect_uri" {
  description = "Register this exact URL in LinkedIn Developer Portal"
  value       = "https://${var.domain}/auth/oauth/linkedin/callback"
}

output "app_namespace" {
  value = kubernetes_namespace.app.metadata[0].name
}

output "ingress_load_balancer_ip" {
  description = "Point DNS A record for domain here"
  value = try(
    data.kubernetes_service.ingress_nginx.status[0].load_balancer[0].ingress[0].ip,
    null
  )
}

output "kubeconfig_cmd" {
  description = "Fetch kubeconfig"
  value       = "doctl kubernetes cluster kubeconfig save ${digitalocean_kubernetes_cluster.main.name}"
}
