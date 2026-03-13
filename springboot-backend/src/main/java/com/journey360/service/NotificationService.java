package com.journey360.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpEmail;

    public NotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    @SuppressWarnings("unchecked")
    public void sendTripItineraryEmail(String toEmail, String tripTitle, Map<String, Object> itinerary) {
        StringBuilder daysHtml = new StringBuilder();

        List<Map<String, Object>> days = (List<Map<String, Object>>) itinerary.getOrDefault("days", List.of());
        for (Map<String, Object> day : days) {
            StringBuilder activitiesHtml = new StringBuilder();
            List<Map<String, Object>> places = (List<Map<String, Object>>) day.getOrDefault("places", List.of());

            for (Map<String, Object> place : places) {
                activitiesHtml.append(String.format("""
                            <div style="margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">
                                <h4 style="margin: 0; color: #1e293b;">%s</h4>
                                <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">%s</p>
                            </div>
                        """, place.getOrDefault("name", ""), place.getOrDefault("description", "")));
            }

            daysHtml.append(String.format("""
                        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                            <h3 style="color: #0f172a; margin-top: 0;">Day %s: %s</h3>
                            %s
                        </div>
                    """, day.getOrDefault("day", day.getOrDefault("dayNumber", "")),
                    day.getOrDefault("theme", "Adventure"), activitiesHtml));
        }

        String htmlContent = String.format(
                """
                            <html>
                            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
                                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <h1 style="color: #2563eb; margin: 0;">Journey360</h1>
                                        <p style="font-size: 18px; color: #64748b;">Your itinerary for <strong>%s</strong> is ready.</p>
                                    </div>
                                    %s
                                    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                        <a href="http://localhost:5173/dashboard"
                                           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                           View Full Interactive Map
                                        </a>
                                        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                                            You received this because you enabled Email Reports in your settings.
                                        </p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        """,
                tripTitle, daysHtml);

        sendRawEmail(toEmail, "✈️ Your Trip to " + tripTitle + " is Ready!", htmlContent, true);
    }

    public void sendEmail(String toEmail, String subject, String content) {
        sendRawEmail(toEmail, subject, content, false);
    }

    private void sendRawEmail(String toEmail, String subject, String content, boolean isHtml) {
        if (smtpEmail == null || smtpEmail.isBlank()) {
            log.warn("⚠️ SMTP credentials not found. Logging only.");
            log.info("📧 Would send to {}: {}", toEmail, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom("Journey360 <" + smtpEmail + ">");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(content, isHtml);
            mailSender.send(message);
            log.info("✅ [EMAIL SENT] Successfully sent to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send email: {}", e.getMessage());
        }
    }
}
