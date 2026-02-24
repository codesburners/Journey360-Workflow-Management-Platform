import logging
import smtplib
import ssl
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notification_service")

class NotificationService:
    def __init__(self):
        self.enabled = True
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 465  # For SSL

    async def send_trip_itinerary_email(self, to_email: str, trip_title: str, itinerary: dict):
        """
        Sends a beautifully formatted HTML email with the trip itinerary.
        """
        if not self.enabled:
            return

        subject = f"✈️ Your Trip to {trip_title} is Ready!"
        
        # Build HTML Content
        days_html = ""
        for day in itinerary.get("days", []):
            activities_html = ""
            for place in day.get("places", []):
                activities_html += f"""
                <div style="margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">
                    <h4 style="margin: 0; color: #1e293b;">{place.get('name')}</h4>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">{place.get('description', '')}</p>
                </div>
                """
            
            days_html += f"""
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #0f172a; margin-top: 0;">Day {day.get('day')}: {day.get('theme', 'Adventure')}</h3>
                {activities_html}
            </div>
            """

        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0;">Journey360</h1>
                        <p style="font-size: 18px; color: #64748b;">Your itinerary for <strong>{trip_title}</strong> is ready.</p>
                    </div>
                    
                    {days_html}
                    
                    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <a href="http://localhost:5173/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Interactive Map</a>
                        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                            You received this because you enabled Email Reports in your settings.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """

        # Send via existing email logic but with HTML support
        return await self._send_raw_email(to_email, subject, html_content, is_html=True)

    async def _send_raw_email(self, to_email: str, subject: str, content: str, is_html: bool = False):
        smtp_email = os.getenv("SMTP_EMAIL")
        smtp_password = os.getenv("SMTP_PASSWORD")

        if not smtp_email or not smtp_password:
            logger.warning("⚠️ SMTP credentials not found. Logging only.")
            return False

        try:
            context = ssl.create_default_context()
            message = MIMEMultipart()
            message["From"] = f"Journey360 <{smtp_email}>"
            message["To"] = to_email
            message["Subject"] = subject
            
            if is_html:
                message.attach(MIMEText(content, "html"))
            else:
                message.attach(MIMEText(content, "plain"))

            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, context=context) as server:
                server.login(smtp_email, smtp_password)
                server.sendmail(smtp_email, to_email, message.as_string())
            
            logger.info(f"✅ [EMAIL SENT] Successfully sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email: {e}")
            return False

    async def send_email(self, to_email: str, subject: str, content: str):
        return await self._send_raw_email(to_email, subject, content, is_html=False)

    async def send_push(self, user_id: str, title: str, message: str):
        if not self.enabled: return
        logger.info(f"🔔 [PUSH] {user_id}: {title} - {message}")
        return True

notification_service = NotificationService()
