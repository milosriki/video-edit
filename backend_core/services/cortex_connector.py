from google.cloud import bigquery
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import os

class AdPerformanceMetric(BaseModel):
    ad_id: str
    campaign_id: str
    impressions: int
    clicks: int
    conversions: int
    spend: float
    roas: float
    date: date

class CortexConnector:
    def __init__(self, project_id: Optional[str] = None):
        # If project_id is not provided, it will be inferred from the environment
        self.client = bigquery.Client(project=project_id)
        self.dataset_id = "cortex_marketing_data"
        self.table_id = "ad_performance" # Assumed table name

    def get_historical_performance(self, days: int = 30) -> List[AdPerformanceMetric]:
        """
        Queries the cortex_marketing_data dataset for ad performance over the last N days.
        Returns a list of AdPerformanceMetric Pydantic models.
        """
        query = f"""
            SELECT
                ad_id,
                campaign_id,
                impressions,
                clicks,
                conversions,
                spend,
                roas,
                date
            FROM
                `{self.client.project}.{self.dataset_id}.{self.table_id}`
            WHERE
                date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("days", "INT64", days)
            ]
        )

        try:
            query_job = self.client.query(query, job_config=job_config)
            results = query_job.result()
            
            metrics = []
            for row in results:
                metrics.append(AdPerformanceMetric(
                    ad_id=row.ad_id,
                    campaign_id=row.campaign_id,
                    impressions=row.impressions,
                    clicks=row.clicks,
                    conversions=row.conversions,
                    spend=row.spend,
                    roas=row.roas,
                    date=row.date
                ))
            return metrics
            
        except Exception as e:
            # In a real scenario, we might want to log this error or raise it.
            # For this setup phase, we'll print it.
            print(f"Error querying BigQuery: {e}")
            return []
