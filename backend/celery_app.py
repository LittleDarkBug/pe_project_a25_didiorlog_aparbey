"""
Configuration Celery pour les tâches asynchrones.
"""

from celery import Celery
import os

# Configuration du broker Redis (modifiable via variable d'env)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "pe_project_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"]  # Auto-discover tasks module
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Paris",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,  # 1h
    broker_connection_retry_on_startup=True,
)
