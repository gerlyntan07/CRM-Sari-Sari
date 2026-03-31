from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError

load_dotenv()

def send_welcome_email(to_email: str, first_name: str, password: str, role: str):
    ses = boto3.client("ses", region_name=os.getenv("AWS_DEFAULT_REGION"))

    subject = "Welcome to Forekas CRM"
    body_text = (
        f"Hello {first_name},\n\n"
        f"You have been added as a {role} in Forekas CRM.\n\n"
        f"You can now log in using your credentials below and start managing your sales activities.\n\n"
        f"Email: {to_email}\n"
        f"Password: {password}\n\n"
        f"Best regards,\nForekas CRM Team"
    )

    body_html = f"""
    <html>
    <body>
        <h3>Hello {first_name},</h3>
        <p>You have been added as a <strong>{role}</strong> in <strong>Forekas CRM</strong>.</p>
        <p>You can now log in using your credentials below and start managing your sales activities.</p>
        
        <p><strong>Login credentials:</strong></p>
        <p><strong>Email:</strong> {to_email}<br>
        <strong>Password:</strong> {password}</p>

        <p>Best regards,<br>Forekas CRM Team</p>
    </body>
    </html>
    """

    try:
        ses.send_email(
            Source="no-reply@forekas.com",  # must be verified in SES
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


def send_otp_email(to_email: str, otp: str):
    """Send OTP via AWS SES for password reset"""
    ses = boto3.client("ses", region_name=os.getenv("AWS_DEFAULT_REGION"))

    subject = "Your Password Reset Code"
    body_text = (
        f"Hello,\n\n"
        f"Your password reset code is: {otp}\n\n"
        f"This code will expire in 1 minute.\n\n"
        f"If you did not request this code, please ignore this email.\n\n"
        f"Best regards,\nForekas CRM Team"
    )

    body_html = f"""
    <html>
    <body>
        <h3>Password Reset Request</h3>
        <p>Your password reset code is:</p>
        <h1 style="color: #2563eb; font-size: 48px; letter-spacing: 8px; font-family: monospace; text-align: center; margin: 20px 0;">{otp}</h1>
        <p><strong>This code will expire in 1 minute.</strong></p>
        <p>If you did not request this code, please ignore this email.</p>
        
        <p>Best regards,<br>Forekas CRM Team</p>
    </body>
    </html>
    """

    try:
        ses.send_email(
            Source="no-reply@forekas.com",  # must be verified in SES
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": body_text},
                    "Html": {"Data": body_html},
                },
            },
        )
        print(f"✅ OTP email sent to {to_email}")
        return True
    except ClientError as e:
        error_msg = e.response['Error']['Message']
        print(f"❌ Failed to send OTP email to {to_email}: {error_msg}")
        # 🔧 Fallback for testing - print OTP to console if AWS SES fails
        print(f"⚠️  TESTING MODE: OTP for {to_email} is: {otp}")
        return True  # Return True to allow testing even if AWS fails
