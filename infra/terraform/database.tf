resource "digitalocean_database_cluster" "postgres" {
  name                 = "${var.project_name}-${var.environment}-pg"
  engine               = "pg"
  version              = "16"
  size                 = var.postgres_size
  region               = var.do_region
  node_count           = 1
  private_network_uuid = digitalocean_vpc.main.id

  tags = [var.project_name, var.environment, "postgres"]
}

resource "digitalocean_database_db" "app" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "mockmatch"
}

resource "digitalocean_database_user" "app" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "mockmatch"
}

resource "digitalocean_database_firewall" "postgres" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "k8s"
    value = digitalocean_kubernetes_cluster.main.id
  }
}

# Valkey (Redis-compatible) for BullMQ + OTP + refresh tokens
resource "digitalocean_database_cluster" "valkey" {
  name                 = "${var.project_name}-${var.environment}-valkey"
  engine               = "valkey"
  version              = "8"
  size                 = var.redis_size
  region               = var.do_region
  node_count           = 1
  private_network_uuid = digitalocean_vpc.main.id

  tags = [var.project_name, var.environment, "valkey"]
}

resource "digitalocean_database_firewall" "valkey" {
  cluster_id = digitalocean_database_cluster.valkey.id

  rule {
    type  = "k8s"
    value = digitalocean_kubernetes_cluster.main.id
  }
}

locals {
  # sslmode=require for managed Postgres private host
  database_url = format(
    "postgresql://%s:%s@%s:%s/%s?sslmode=require",
    digitalocean_database_user.app.name,
    digitalocean_database_user.app.password,
    digitalocean_database_cluster.postgres.private_host,
    digitalocean_database_cluster.postgres.port,
    digitalocean_database_db.app.name
  )

  redis_url = format(
    "rediss://default:%s@%s:%s",
    digitalocean_database_cluster.valkey.password,
    digitalocean_database_cluster.valkey.private_host,
    digitalocean_database_cluster.valkey.port
  )
}
