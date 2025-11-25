output "bigquery_dataset_id" {
  value       = google_bigquery_dataset.cortex_marketing_data.dataset_id
  description = "The ID of the BigQuery dataset"
}

output "cloud_run_url" {
  value       = google_cloud_run_v2_service.titan_backend.uri
  description = "The URL of the Titan Backend Cloud Run service"
}
