resource "digitalocean_vpc" "main" {
  name     = "${var.project_name}-${var.environment}-vpc"
  region   = var.do_region
  ip_range = "10.120.0.0/16"
}
