from apscheduler.schedulers.background import BackgroundScheduler
from app.services.clustering import update_clusters_periodically
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def start_workers():
    logger.info("Starting background workers...")
    # Run cluster retraining every 24 hours
    scheduler.add_job(update_clusters_periodically, 'interval', hours=24)
    scheduler.start()

def stop_workers():
    logger.info("Stopping background workers...")
    scheduler.shutdown()
