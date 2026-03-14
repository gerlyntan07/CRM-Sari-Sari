# backup_reminder.py
"""
Scheduled backup reminder notifications for companies.
Sends only in-app notifications based on backup_reminder frequency.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.company import Company
from backend.models.auth import User
from datetime import datetime
from backend.routers.ws_notification import broadcast_notification
import asyncio

def send_in_app_notification(user_id, message):
    # Send notification to AdminHeader via WebSocket
    notification = {
        "title": "Backup Reminder",
        "message": message
    }
    # Run the coroutine in the event loop
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(broadcast_notification(notification, user_id))
    print(f"[In-App] UserID: {user_id} | Message: {message}")

def backup_reminder_job():
    db: Session = SessionLocal()
    try:
        companies = db.query(Company).all()
        for company in companies:
            freq = (company.backup_reminder or "Daily").lower()
            now = datetime.now()
            should_notify = False
            if freq == "daily":
                should_notify = True
            elif freq == "weekly" and now.weekday() == 0:  # Monday
                should_notify = True
            elif freq == "monthly" and now.day == 1:
                should_notify = True
            elif freq == "quarterly" and now.month in [1, 4, 7, 10] and now.day == 1:
                should_notify = True
            elif freq == "yearly" and now.month == 1 and now.day == 1:
                should_notify = True
            if should_notify:
                users = db.query(User).filter(User.related_to_company == company.id, User.is_active == True).all()
                for user in users:
                    body = "Please remember to back up your CRM data today."
                    send_in_app_notification(user.id, body)
    except Exception as e:
        print(f"[Backup Reminder Error] {e}")
        db.rollback()
    finally:
        db.close()

# Scheduler setup (to be called from app startup)
def start_backup_reminder_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(backup_reminder_job, 'cron', hour=8, minute=0)  # Run daily at 8:00 AM
    scheduler.start()
    print("[Scheduler] Backup reminder job started.")
