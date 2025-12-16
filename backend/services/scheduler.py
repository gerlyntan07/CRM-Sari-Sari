# backend/services/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pytz

# Import your DB session and Model
from database import SessionLocal 
from models.lead import Lead, LeadStatus

def delete_old_converted_leads():
    """
    Hard deletes leads that have been 'Converted' for more than 30 days
    based on their last 'updated_at' timestamp.
    """
    db: Session = SessionLocal()
    try:
        # Calculate the cutoff date (30 days ago from now)
        # Ensure we use timezone-aware datetime if your DB uses it (recommended)
        cutoff_date = datetime.now(pytz.utc) - timedelta(days=30)
        
        # Find leads that match BOTH criteria
        leads_to_delete = db.query(Lead).filter(
            Lead.status == LeadStatus.CONVERTED.value,  # Status is 'Converted'
            Lead.updated_at < cutoff_date               # Last update was > 30 days ago
        ).all()
        
        count = len(leads_to_delete)
        
        if count > 0:
            for lead in leads_to_delete:
                db.delete(lead)
            db.commit()
            print(f"[Auto-Cleanup] Deleted {count} converted leads older than 30 days.")
        else:
            # Optional: Print log just to know it ran
            # print("[Auto-Cleanup] No old converted leads found.")
            pass
            
    except Exception as e:
        print(f"[Auto-Cleanup Error] {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run this job once every day (interval)
    scheduler.add_job(delete_old_converted_leads, 'interval', days=1)
    scheduler.start()