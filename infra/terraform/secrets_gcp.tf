resource "random_password" "jwt_access" {
  length  = 48
  special = false
}

resource "random_password" "jwt_refresh" {
  length  = 48
  special = false
}

locals {
  secret_ids = {
    database_url          = "${var.project_name}-${var.environment}-database-url"
    redis_url             = "${var.project_name}-${var.environment}-redis-url"
    jwt_access_secret     = "${var.project_name}-${var.environment}-jwt-access"
    jwt_refresh_secret    = "${var.project_name}-${var.environment}-jwt-refresh"
    linkedin_client_id    = "${var.project_name}-${var.environment}-linkedin-client-id"
    linkedin_client_secret = "${var.project_name}-${var.environment}-linkedin-client-secret"
    app_url               = "${var.project_name}-${var.environment}-app-url"
    api_url               = "${var.project_name}-${var.environment}-api-url"
  }

  app_url = "https://${var.domain}"
  api_url = "https://${var.domain}"
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secret_ids
  secret_id = each.value
  project   = var.gcp_project

  replication {
    auto {}
  }

  labels = {
    app         = var.project_name
    environment = var.environment
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.secrets["database_url"].id
  secret_data = local.database_url
}

resource "google_secret_manager_secret_version" "redis_url" {
  secret      = google_secret_manager_secret.secrets["redis_url"].id
  secret_data = local.redis_url
}

resource "google_secret_manager_secret_version" "jwt_access" {
  secret      = google_secret_manager_secret.secrets["jwt_access_secret"].id
  secret_data = random_password.jwt_access.result
}

resource "google_secret_manager_secret_version" "jwt_refresh" {
  secret      = google_secret_manager_secret.secrets["jwt_refresh_secret"].id
  secret_data = random_password.jwt_refresh.result
}

resource "google_secret_manager_secret_version" "linkedin_client_id" {
  secret      = google_secret_manager_secret.secrets["linkedin_client_id"].id
  secret_data = var.linkedin_client_id != "" ? var.linkedin_client_id : "UNSET"
}

resource "google_secret_manager_secret_version" "linkedin_client_secret" {
  secret      = google_secret_manager_secret.secrets["linkedin_client_secret"].id
  secret_data = var.linkedin_client_secret != "" ? var.linkedin_client_secret : "UNSET"
}

resource "google_secret_manager_secret_version" "app_url" {
  secret      = google_secret_manager_secret.secrets["app_url"].id
  secret_data = local.app_url
}

resource "google_secret_manager_secret_version" "api_url" {
  secret      = google_secret_manager_secret.secrets["api_url"].id
  secret_data = local.api_url
}
