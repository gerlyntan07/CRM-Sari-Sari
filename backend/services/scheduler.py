# backend/services/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pytz

from database import SessionLocal
from models.lead import Lead, LeadStatus
from models.auditlog import Auditlog


def delete_old_converted_leads():
    """
    Hard deletes leads that have been CONVERTED for more than 7 days
    based on their last updated_at timestamp.
    """
    db: Session = SessionLocal()
    try:
        cutoff_date = datetime.now(pytz.utc) - timedelta(days=7)

        deleted_count = db.query(Lead).filter(
            Lead.status == LeadStatus.CONVERTED.value,
            Lead.updated_at < cutoff_date
        ).delete(synchronize_session=False)

        db.commit()

        if deleted_count > 0:
            print(f"[Auto-Cleanup] Deleted {deleted_count} converted leads.")

    except Exception as e:
        print(f"[Auto-Cleanup Leads Error] {e}")
        db.rollback()
    finally:
        db.close()


def delete_old_audit_logs():
    """
    Hard deletes all audit logs older than 6 months.
    """
    db: Session = SessionLocal()
    try:
        cutoff_date = datetime.now(pytz.utc) - timedelta(days=180)

        deleted_count = db.query(Auditlog).filter(
            Auditlog.timestamp < cutoff_date
        ).delete(synchronize_session=False)

        db.commit()

        if deleted_count > 0:
            print(f"[Auto-Cleanup] Purged {deleted_count} audit logs.")

    except Exception as e:
        print(f"[Auto-Cleanup Audit Error] {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    """
    Starts and returns the APScheduler instance.
    """
    scheduler = BackgroundScheduler(timezone=pytz.utc)

    scheduler.add_job(
        delete_old_converted_leads,
        trigger="interval",
        days=1,
        id="cleanup_converted_leads",
        replace_existing=True
    )

    scheduler.add_job(
        delete_old_audit_logs,
        trigger="interval",
        days=1,
        id="cleanup_audit_logs",
        replace_existing=True
    )

    scheduler.start()
    return scheduler
