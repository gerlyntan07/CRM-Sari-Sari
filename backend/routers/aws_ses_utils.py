from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError

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
