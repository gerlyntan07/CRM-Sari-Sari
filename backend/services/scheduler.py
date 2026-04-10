# backend/services/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pytz

from database import SessionLocal
from models.lead import Lead, LeadStatus
from models.auditlog import Auditlog
from services.backup_reminder import process_backup_reminders
from services.subscription_lifecycle import process_subscription_discount_lifecycle, process_trial_notifications


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

    def run_trial_subscription_processor():
        db: Session = SessionLocal()
        try:
            processed = process_trial_notifications(db)
            if processed:
                print(f"[Subscription Lifecycle] Processed {processed} trial subscriptions.")

            discount_processed = process_subscription_discount_lifecycle(db)
            if discount_processed:
                print(f"[Subscription Lifecycle] Recomputed {discount_processed} subscription discount prices.")
        except Exception as e:
            print(f"[Subscription Lifecycle Error] {e}")
            db.rollback()
        finally:
            db.close()

    scheduler.add_job(
        run_trial_subscription_processor,
        trigger="interval",
        hours=12,
        id="process_trial_subscriptions",
        replace_existing=True,
    )

    def run_backup_reminder_processor():
        db: Session = SessionLocal()
        try:
            created = process_backup_reminders(db)
            if created:
                print(f"[Backup Reminder] Created {created} notifications.")
        except Exception as e:
            print(f"[Backup Reminder Error] {e}")
            db.rollback()
        finally:
            db.close()

    scheduler.add_job(
        run_backup_reminder_processor,
        trigger="cron",
        hour=8,
        minute=0,
        timezone=pytz.timezone("Asia/Manila"),
        id="backup_reminder_notifications",
        replace_existing=True,
    )

    scheduler.start()
    return scheduler
