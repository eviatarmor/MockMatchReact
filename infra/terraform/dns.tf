resource "digitalocean_domain" "main" {
  count = var.create_dns_records ? 1 : 0
  name  = var.domain
}

# Point domain at ingress LB once known. After first apply, set:
#   data.kubernetes_service.ingress_nginx status load_balancer ingress
# Operators often create the A record manually after LB IP appears.
#
# Placeholder output documents the required record; optional data source
# can be enabled once the LoadBalancer is provisioned.

data "kubernetes_service" "ingress_nginx" {
  metadata {
    name      = "ingress-nginx-controller"
    namespace = "ingress-nginx"
  }

  depends_on = [helm_release.ingress_nginx]
}

resource "digitalocean_record" "apex" {
  count = var.create_dns_records ? 1 : 0

  domain = digitalocean_domain.main[0].id
  type   = "A"
  name   = "@"
  value = try(
    data.kubernetes_service.ingress_nginx.status[0].load_balancer[0].ingress[0].ip,
    "0.0.0.0"
  )
  ttl = 300

  lifecycle {
    ignore_changes = [value]
  }
}
