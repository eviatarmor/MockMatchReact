resource "google_service_account" "eso" {
  account_id   = "${var.project_name}-${var.environment}-eso"
  display_name = "MockMatch External Secrets (${var.environment})"
  project      = var.gcp_project
}

# Per-secret accessor (least privilege)
resource "google_secret_manager_secret_iam_member" "eso_accessor" {
  for_each  = google_secret_manager_secret.secrets
  project   = var.gcp_project
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.eso.email}"
}

# SA key for ESO on DOKS (no GCE metadata). Store only as K8s secret via TF.
# Rotate periodically; prefer WIF if you later run a bridge.
resource "google_service_account_key" "eso" {
  service_account_id = google_service_account.eso.name
}
