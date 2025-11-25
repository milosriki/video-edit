terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "us-central1"
}

variable "project_id" {
  description = "The ID of the Google Cloud project"
  type        = string
}

# Enable Vertex AI API (includes Agent Engine and Vector Search capabilities)
resource "google_project_service" "vertex_ai" {
  service            = "aiplatform.googleapis.com"
  disable_on_destroy = false
}

# BigQuery Dataset: cortex_marketing_data
resource "google_bigquery_dataset" "cortex_marketing_data" {
  dataset_id                  = "cortex_marketing_data"
  friendly_name               = "Cortex Marketing Data"
  description                 = "Dataset for Cortex Marketing Data"
  location                    = "US"
  default_table_expiration_ms = 3600000

  labels = {
    env = "production"
  }
}

# Cloud Run Service: capi-gateway
# Using the official Google Tag Manager Server-side image which is standard for CAPI (Conversions API)
resource "google_cloud_run_service" "capi_gateway" {
  name     = "capi-gateway"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable"
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
        
        # Environment variables can be added here
        env {
          name  = "CONTAINER_CONFIG"
          value = "true" # Placeholder
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.vertex_ai]
}
