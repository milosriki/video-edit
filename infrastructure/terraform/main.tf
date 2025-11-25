# Enable APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "aiplatform.googleapis.com",
    "bigquery.googleapis.com",
    "run.googleapis.com",
    "dialogflow.googleapis.com", # Agent Engine / Dialogflow CX
    "cortex-data-foundation.googleapis.com"
  ])
  service            = each.key
  disable_on_destroy = false
}

# BigQuery Dataset (Cortex Marketing Data)
resource "google_bigquery_dataset" "cortex_marketing_data" {
  dataset_id                  = "cortex_marketing_data"
  friendly_name               = "Cortex Marketing Data"
  description                 = "Centralized marketing data warehouse for Project Titan (Cortex Framework)"
  location                    = var.region
  default_table_expiration_ms = null

  labels = {
    env = "production"
    app = "titan-marketing-engine"
  }

  depends_on = [google_project_service.apis]
}

# Cloud Run Service (Python Backend)
resource "google_cloud_run_v2_service" "titan_backend" {
  name     = "titan-backend-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder until Python build is ready
      resources {
        limits = {
          cpu    = "1000m"
          memory = "1Gi" # Increased for AI workloads
        }
      }
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "BQ_DATASET"
        value = google_bigquery_dataset.cortex_marketing_data.dataset_id
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# Vertex AI Agent Engine (Placeholder for Agent Builder / Dialogflow CX)
# Note: Full Agent Engine provisioning often requires specific modules or manual setup
# We ensure the API is enabled and create a placeholder for the Agent App if supported via TF directly
# For now, we will output the location where the agent should be configured.
