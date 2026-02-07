from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError
from datetime import datetime

load_dotenv()

def send_welcome_email(to_email: str, first_name: str, password: str, role: str):
    ses = boto3.client("ses", region_name=os.getenv("AWS_DEFAULT_REGION"))

    subject = "Welcome to Sari-Sari CRM"
    body_text = (
        f"Hello {first_name},\n\n"
        f"You have been added as a {role} in Sari-Sari CRM.\n\n"
        f"You can now log in using your credentials below and start managing your sales activities.\n\n"
        f"Email: {to_email}\n"
        f"Password: {password}\n\n"
        f"Best regards,\nSari-Sari CRM Team"
    )

    body_html = f"""
    <html>
    <body>
        <h3>Hello {first_name},</h3>
        <p>You have been added as a <strong>{role}</strong> in <strong>Sari-Sari CRM</strong>.</p>
        <p>You can now log in using your credentials below and start managing your sales activities.</p>
        
        <p><strong>Login credentials:</strong></p>
        <p><strong>Email:</strong> {to_email}<br>
        <strong>Password:</strong> {password}</p>

        <p>Best regards,<br>Sari-Sari CRM Team</p>
    </body>
    </html>
    """

    try:
        ses.send_email(
            Source="no-reply@sari-sari.com",  # must be verified in SES
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": body_text},
                    "Html": {"Data": body_html},
                },
            },
        )
        print(f"✅ Email sent to {to_email}")
    except ClientError as e:
        print(f"❌ Failed to send email to {to_email}: {e.response['Error']['Message']}")


def send_subscription_overdue_email(to_email: str, first_name: str, company_name: str, plan_name: str, end_date: datetime):
    """Send subscription overdue notification email"""
    ses = boto3.client("ses", region_name=os.getenv("AWS_DEFAULT_REGION"))
    
    end_date_str = end_date.strftime("%B %d, %Y") if end_date else "Unknown"
    
    subject = f"Subscription Overdue Notice - {company_name}"
    body_text = (
        f"Hello {first_name},\n\n"
        f"This is a reminder that your subscription for {company_name} on the {plan_name} plan has expired.\n\n"
        f"Subscription End Date: {end_date_str}\n\n"
        f"To continue enjoying uninterrupted access to Sari-Sari CRM, please renew your subscription at your earliest convenience.\n\n"
        f"If you have any questions or need assistance, please contact our support team.\n\n"
        f"Best regards,\nSari-Sari CRM Support Team"
    )

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f44336, #e91e63); padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">⚠️ Subscription Overdue Notice</h2>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                <h3 style="color: #333;">Hello {first_name},</h3>
                
                <p>This is a reminder that your subscription for <strong>{company_name}</strong> has expired.</p>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Plan:</strong> {plan_name}</p>
                    <p style="margin: 5px 0 0;"><strong>Expired on:</strong> {end_date_str}</p>
                </div>
                
                <p>To continue enjoying uninterrupted access to all Sari-Sari CRM features, please renew your subscription at your earliest convenience.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://crm.sari-sari.com/settings" 
                       style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Renew Subscription
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; margin: 0;">
                    Best regards,<br>
                    <strong>Sari-Sari CRM Support Team</strong>
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        ses.send_email(
            Source="no-reply@sari-sari.com",  # must be verified in SES
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": body_text},
                    "Html": {"Data": body_html},
                },
            },
        )
        print(f"✅ Subscription overdue email sent to {to_email}")
        return True
    except ClientError as e:
        print(f"❌ Failed to send subscription overdue email to {to_email}: {e.response['Error']['Message']}")
        raise e
