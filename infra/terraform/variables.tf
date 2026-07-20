variable "do_token" {
  type        = string
  description = "DigitalOcean API token (leave empty to use DIGITALOCEAN_TOKEN env)"
  sensitive   = true
  default     = ""
}

variable "gcp_project" {
  type        = string
  description = "GCP project id for Secret Manager"
}

variable "gcp_region" {
  type        = string
  description = "GCP region (Secret Manager is global; used for SA key resources)"
  default     = "us-central1"
}

variable "do_region" {
  type        = string
  description = "DigitalOcean region"
  default     = "nyc3"
}

variable "project_name" {
  type        = string
  description = "Name prefix for resources"
  default     = "mockmatch"
}

variable "environment" {
  type        = string
  description = "Environment label (prod, staging)"
  default     = "prod"
}

variable "domain" {
  type        = string
  description = "Primary domain for HTTPS and OAuth redirects (e.g. app.example.com)"
}

variable "create_dns_records" {
  type        = bool
  description = "Create DigitalOcean domain + A records (domain must use DO nameservers)"
  default     = false
}

variable "admin_cidrs" {
  type        = list(string)
  description = "CIDRs allowed SSH to edge droplet (if enabled)"
  default     = []
}

variable "doks_node_size" {
  type        = string
  description = "DOKS default node size"
  default     = "s-2vcpu-4gb"
}

variable "doks_min_nodes" {
  type        = number
  default     = 2
}

variable "doks_max_nodes" {
  type        = number
  default     = 5
}

variable "postgres_size" {
  type        = string
  description = "Managed Postgres size slug"
  default     = "db-s-1vcpu-1gb"
}

variable "redis_size" {
  type        = string
  description = "Managed Valkey/Redis size slug"
  default     = "db-s-1vcpu-1gb"
}

variable "linkedin_client_id" {
  type        = string
  description = "LinkedIn OAuth client id (empty until portal setup)"
  default     = ""
  sensitive   = true
}

variable "linkedin_client_secret" {
  type        = string
  description = "LinkedIn OAuth client secret"
  default     = ""
  sensitive   = true
}

variable "api_image" {
  type        = string
  description = "Container image for API/worker (DOCR path after first push)"
  default     = ""
}

variable "api_replicas" {
  type        = number
  default     = 2
}

variable "enable_edge_droplet" {
  type        = bool
  description = "Provision a Caddy SPA edge droplet (false = Ingress-only on DOKS)"
  default     = false
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key for edge droplet"
  default     = ""
}
