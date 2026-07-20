data "digitalocean_kubernetes_versions" "current" {
  version_prefix = "1.31."
}

resource "digitalocean_kubernetes_cluster" "main" {
  name     = "${var.project_name}-${var.environment}"
  region   = var.do_region
  version  = data.digitalocean_kubernetes_versions.current.latest_version
  vpc_uuid = digitalocean_vpc.main.id

  # HA control plane optional later (extra cost)
  ha = false

  tags = [var.project_name, var.environment, "doks"]

  node_pool {
    name       = "default"
    size       = var.doks_node_size
    auto_scale = true
    min_nodes  = var.doks_min_nodes
    max_nodes  = var.doks_max_nodes
    tags       = [var.project_name, "default-pool"]
  }

  maintenance_policy {
    start_time = "04:00"
    day        = "sunday"
  }
}

resource "digitalocean_container_registry" "main" {
  name                   = "${var.project_name}-${var.environment}"
  subscription_tier_slug = "basic"
  region                 = var.do_region
}
