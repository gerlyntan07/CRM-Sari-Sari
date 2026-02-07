# backend/routers/support.py
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Dict
from datetime import datetime, timezone
import json

from database import get_db
from models.auth import User, UserRole
from models.support import SupportTicket, SupportChatSession, ChatMessage, TicketStatus
from models.subscription import Subscription
from models.company import Company
from schemas.support import (
    SupportTicketCreate, SupportTicketUpdate, SupportTicketResponse, SupportTicketBulkDelete,
    ChatSessionCreate, ChatSessionResponse,
    ChatMessageCreate, ChatMessageResponse,
    SubscriptionOverdueEmail, SubscriptionEmailResponse,
    SupportStats
)
from .auth_utils import get_current_user
from .aws_ses_utils import send_subscription_overdue_email

router = APIRouter(prefix="/support", tags=["Support"])

# Role check helper
def require_admin_team(current_user: User):
    """Check if user has Admin Team role or higher privilege"""
    allowed_roles = {"CEO", "ADMIN", "ADMIN TEAM"}
    if current_user.role.upper() not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied. Admin Team role required.")
    return current_user


# ==================== Support Tickets Endpoints ====================

@router.post("/tickets", response_model=SupportTicketResponse)
def create_ticket(
    ticket: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new support ticket"""
    new_ticket = SupportTicket(
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        created_by=current_user.id,
        company_id=current_user.related_to_company
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket


@router.get("/tickets", response_model=List[SupportTicketResponse])
def get_tickets(
    status: str = None,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get support tickets based on user role"""
    query = db.query(SupportTicket).options(
        joinedload(SupportTicket.creator),
        joinedload(SupportTicket.assignee)
    )
    
    # Admin Team can see all tickets, others see only their own
    if current_user.role.upper() in ["CEO", "ADMIN", "ADMIN TEAM"]:
        pass  # No filter for admin roles
    else:
        query = query.filter(SupportTicket.created_by == current_user.id)
    
    if status:
        query = query.filter(SupportTicket.status == status)
    if category:
        query = query.filter(SupportTicket.category == category)
    
    return query.order_by(SupportTicket.created_at.desc()).all()


@router.get("/tickets/{ticket_id}", response_model=SupportTicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific support ticket"""
    ticket = db.query(SupportTicket).options(
        joinedload(SupportTicket.creator),
        joinedload(SupportTicket.assignee)
    ).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check access: Admin Team can access all, others only their own
    if current_user.role.upper() not in ["CEO", "ADMIN", "ADMIN TEAM"]:
        if ticket.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return ticket


@router.put("/tickets/{ticket_id}", response_model=SupportTicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_update: SupportTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a support ticket (Admin Team can update any, others only their own)"""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Only Admin Team can assign tickets or change status
    if current_user.role.upper() not in ["CEO", "ADMIN", "ADMIN TEAM"]:
        if ticket.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        # Regular users can only update subject, description, category, priority
        if ticket_update.assigned_to is not None or ticket_update.status is not None:
            raise HTTPException(status_code=403, detail="You cannot assign or change status")
    
    update_data = ticket_update.dict(exclude_unset=True)
    
    # Set resolved_at when status changes to Resolved or Closed
    if ticket_update.status in [TicketStatus.RESOLVED.value, TicketStatus.CLOSED.value]:
        update_data["resolved_at"] = datetime.now(timezone.utc)
    
    for key, value in update_data.items():
        setattr(ticket, key, value)
    
    db.commit()
    db.refresh(ticket)
    return ticket


@router.delete("/tickets/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a support ticket"""
    require_admin_team(current_user)
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(ticket)
    db.commit()
    return {"message": "Ticket deleted successfully"}


@router.post("/tickets/bulk-delete")
def bulk_delete_tickets(
    data: SupportTicketBulkDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk delete support tickets"""
    require_admin_team(current_user)
    
    db.query(SupportTicket).filter(SupportTicket.id.in_(data.ticket_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Deleted {len(data.ticket_ids)} tickets"}


# ==================== Chat Session Endpoints ====================

@router.post("/chat/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    session_data: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new chat session"""
    new_session = SupportChatSession(
        user_id=current_user.id,
        company_id=current_user.related_to_company,
        ticket_id=session_data.ticket_id
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/chat/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat sessions based on user role"""
    query = db.query(SupportChatSession).options(
        joinedload(SupportChatSession.user),
        joinedload(SupportChatSession.support_agent)
    )
    
    # Admin Team can see all sessions
    if current_user.role.upper() in ["CEO", "ADMIN", "ADMIN TEAM"]:
        pass
    else:
        query = query.filter(SupportChatSession.user_id == current_user.id)
    
    if status:
        query = query.filter(SupportChatSession.status == status)
    
    return query.order_by(SupportChatSession.created_at.desc()).all()


@router.get("/chat/sessions/active", response_model=List[ChatSessionResponse])
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get active chat sessions for Admin Team to manage"""
    require_admin_team(current_user)
    
    sessions = db.query(SupportChatSession).options(
        joinedload(SupportChatSession.user),
        joinedload(SupportChatSession.support_agent)
    ).filter(
        SupportChatSession.status == "Active"
    ).order_by(SupportChatSession.created_at.asc()).all()
    
    return sessions


@router.put("/chat/sessions/{session_id}/assign")
def assign_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign self as support agent to a chat session"""
    require_admin_team(current_user)
    
    session = db.query(SupportChatSession).filter(SupportChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session.support_agent_id = current_user.id
    db.commit()
    db.refresh(session)
    return {"message": "Session assigned successfully", "session_id": session.id}


@router.put("/chat/sessions/{session_id}/close")
def close_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Close a chat session"""
    session = db.query(SupportChatSession).filter(SupportChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Only Admin Team or the session owner can close
    if current_user.role.upper() not in ["CEO", "ADMIN", "ADMIN TEAM"]:
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    session.status = "Closed"
    session.ended_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Session closed successfully"}


# ==================== Chat Message Endpoints ====================

@router.post("/chat/messages", response_model=ChatMessageResponse)
def send_chat_message(
    message_data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a chat message in a session"""
    new_message = ChatMessage(
        session_id=message_data.session_id,
        ticket_id=message_data.ticket_id,
        sender_id=current_user.id,
        message=message_data.message
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


@router.get("/chat/messages/{session_id}", response_model=List[ChatMessageResponse])
def get_chat_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages for a chat session"""
    session = db.query(SupportChatSession).filter(SupportChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Check access
    if current_user.role.upper() not in ["CEO", "ADMIN", "ADMIN TEAM"]:
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    messages = db.query(ChatMessage).options(
        joinedload(ChatMessage.sender)
    ).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    # Mark messages as read
    db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.sender_id != current_user.id,
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return messages


# ==================== Subscription Management Endpoints ====================

@router.get("/subscriptions/overdue")
def get_overdue_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all subscriptions that are overdue (Admin Team only)"""
    require_admin_team(current_user)
    
    now = datetime.now(timezone.utc)
    overdue = db.query(Subscription).options(
        joinedload(Subscription.subscriber)
    ).filter(
        Subscription.end_date < now,
        Subscription.status == "Active"
    ).all()
    
    result = []
    for sub in overdue:
        company = sub.subscriber
        ceo = db.query(User).filter(
            User.related_to_company == company.id,
            User.role == "CEO"
        ).first() if company else None
        
        result.append({
            "id": sub.id,
            "company_id": sub.company_id,
            "company_name": company.company_name if company else "Unknown",
            "plan_name": sub.plan_name,
            "price": sub.price,
            "status": sub.status,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
            "ceo_email": ceo.email if ceo else None,
            "ceo_name": f"{ceo.first_name} {ceo.last_name}" if ceo else None,
            "days_overdue": (now - sub.end_date).days if sub.end_date else 0
        })
    
    return result


@router.get("/subscriptions/all")
def get_all_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all subscriptions with company details (Admin Team only)"""
    require_admin_team(current_user)
    
    now = datetime.now(timezone.utc)
    subscriptions = db.query(Subscription).options(
        joinedload(Subscription.subscriber)
    ).all()
    
    result = []
    for sub in subscriptions:
        company = sub.subscriber
        ceo = db.query(User).filter(
            User.related_to_company == company.id,
            User.role == "CEO"
        ).first() if company else None
        
        is_overdue = sub.end_date < now if sub.end_date else False
        
        result.append({
            "id": sub.id,
            "company_id": sub.company_id,
            "company_name": company.company_name if company else "Unknown",
            "plan_name": sub.plan_name,
            "price": sub.price,
            "status": sub.status,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
            "ceo_email": ceo.email if ceo else None,
            "ceo_name": f"{ceo.first_name} {ceo.last_name}" if ceo else None,
            "is_overdue": is_overdue,
            "days_overdue": (now - sub.end_date).days if is_overdue and sub.end_date else 0
        })
    
    return result


@router.post("/subscriptions/{subscription_id}/send-overdue-email", response_model=SubscriptionEmailResponse)
def send_overdue_email(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send overdue subscription email to company CEO (Admin Team only)"""
    require_admin_team(current_user)
    
    subscription = db.query(Subscription).options(
        joinedload(Subscription.subscriber)
    ).filter(Subscription.id == subscription_id).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    company = subscription.subscriber
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Find CEO email
    ceo = db.query(User).filter(
        User.related_to_company == company.id,
        User.role == "CEO"
    ).first()
    
    if not ceo:
        raise HTTPException(status_code=404, detail="Company CEO not found")
    
    try:
        send_subscription_overdue_email(
            to_email=ceo.email,
            first_name=ceo.first_name,
            company_name=company.company_name,
            plan_name=subscription.plan_name,
            end_date=subscription.end_date
        )
        return SubscriptionEmailResponse(
            success=True,
            message=f"Overdue email sent to {ceo.email}",
            company_id=company.id
        )
    except Exception as e:
        return SubscriptionEmailResponse(
            success=False,
            message=f"Failed to send email: {str(e)}",
            company_id=company.id
        )


@router.put("/subscriptions/{subscription_id}/update-status")
def update_subscription_status(
    subscription_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update subscription status (Admin Team only)"""
    require_admin_team(current_user)
    
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    valid_statuses = ["Active", "Cancelled", "Expired"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    subscription.status = status
    db.commit()
    db.refresh(subscription)
    return {"message": f"Subscription status updated to {status}"}


# ==================== Stats Endpoint ====================

@router.get("/stats", response_model=SupportStats)
def get_support_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get support statistics (Admin Team only)"""
    require_admin_team(current_user)
    
    now = datetime.now(timezone.utc)
    
    total_tickets = db.query(SupportTicket).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "Open").count()
    in_progress = db.query(SupportTicket).filter(SupportTicket.status == "In Progress").count()
    resolved = db.query(SupportTicket).filter(
        SupportTicket.status.in_(["Resolved", "Closed"])
    ).count()
    active_chats = db.query(SupportChatSession).filter(
        SupportChatSession.status == "Active"
    ).count()
    overdue_subs = db.query(Subscription).filter(
        Subscription.end_date < now,
        Subscription.status == "Active"
    ).count()
    
    return SupportStats(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        in_progress_tickets=in_progress,
        resolved_tickets=resolved,
        active_chats=active_chats,
        overdue_subscriptions=overdue_subs
    )


# ==================== Admin Team Members Endpoint ====================

@router.get("/team/members")
def get_admin_team_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all Admin Team members"""
    require_admin_team(current_user)
    
    members = db.query(User).filter(
        User.role == UserRole.ADMIN_TEAM.value,
        User.is_active == True
    ).all()
    
    return [{
        "id": m.id,
        "first_name": m.first_name,
        "last_name": m.last_name,
        "email": m.email,
        "profile_picture": m.profile_picture
    } for m in members]


# ==================== WebSocket for Live Chat ====================

# Store active WebSocket connections for support chat
support_chat_connections: Dict[int, Dict] = {}  # session_id -> {"user": WebSocket, "support": WebSocket}


@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(
    websocket: WebSocket,
    session_id: int,
    user_id: int = Query(...),
    is_support: bool = Query(False)
):
    """WebSocket endpoint for live chat"""
    await websocket.accept()
    
    # Initialize session connections if not exists
    if session_id not in support_chat_connections:
        support_chat_connections[session_id] = {"user": None, "support": None, "user_id": None, "support_id": None}
    
    # Store connection based on role
    if is_support:
        support_chat_connections[session_id]["support"] = websocket
        support_chat_connections[session_id]["support_id"] = user_id
    else:
        support_chat_connections[session_id]["user"] = websocket
        support_chat_connections[session_id]["user_id"] = user_id
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Broadcast to other participant
            conn = support_chat_connections.get(session_id, {})
            target_ws = conn.get("support") if not is_support else conn.get("user")
            
            if target_ws:
                await target_ws.send_text(json.dumps({
                    "sender_id": user_id,
                    "message": message_data.get("message", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "is_support": is_support
                }))
    
    except WebSocketDisconnect:
        # Remove disconnected connection
        if session_id in support_chat_connections:
            if is_support:
                support_chat_connections[session_id]["support"] = None
            else:
                support_chat_connections[session_id]["user"] = None
            
            # Clean up if both disconnected
            if not support_chat_connections[session_id]["user"] and not support_chat_connections[session_id]["support"]:
                del support_chat_connections[session_id]
