import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Production-ready Email Service
 * Supports multiple email providers (SendGrid, SMTP, etc.)
 */
export class EmailService {
  private transporter: Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@habibistay.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'HabibiStay';

    // Initialize transporter based on environment configuration
    this.transporter = this.createTransporter();
  }

  /**
   * Create email transporter based on environment configuration
   */
  private createTransporter(): Transporter {
    // Check if using SendGrid
    if (process.env.SENDGRID_API_KEY) {
      return nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    }

    // Check if using AWS SES
    if (process.env.AWS_SES_REGION) {
      return nodemailer.createTransporter({
        host: `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_SES_ACCESS_KEY_ID!,
          pass: process.env.AWS_SES_SECRET_ACCESS_KEY!,
        },
      });
    }

    // Default to SMTP configuration
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASSWORD!,
        },
      });
    }

    // Fallback to console logging for development
    console.warn('No email service configured. Emails will be logged to console.');
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  /**
   * Send a generic email
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text || this.stripHtml(params.html),
        replyTo: params.replyTo,
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(params: {
    to: string;
    guestName: string;
    propertyTitle: string;
    checkInDate: string;
    checkOutDate: string;
    totalPrice: number;
    bookingId: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2957c3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .total { font-size: 1.2em; font-weight: bold; color: #2957c3; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2957c3; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 0.9em; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed! 🎉</h1>
            </div>
            <div class="content">
              <p>Dear ${params.guestName},</p>
              <p>Your booking has been confirmed! We're excited to host you at <strong>${params.propertyTitle}</strong>.</p>
              
              <div class="booking-details">
                <h2>Booking Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${params.bookingId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Property:</span>
                  <span class="detail-value">${params.propertyTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Check-in:</span>
                  <span class="detail-value">${params.checkInDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Check-out:</span>
                  <span class="detail-value">${params.checkOutDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Price:</span>
                  <span class="detail-value total">$${params.totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${params.bookingId}" class="button">View Booking Details</a>
              </p>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Safe travels!</p>
              <p>The HabibiStay Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HabibiStay. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `Booking Confirmed - ${params.propertyTitle}`,
      html,
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceipt(params: {
    to: string;
    guestName: string;
    amount: number;
    currency: string;
    paymentId: string;
    bookingId: string;
    propertyTitle: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2957c3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .receipt-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .amount { font-size: 1.5em; font-weight: bold; color: #2957c3; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 0.9em; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received ✓</h1>
            </div>
            <div class="content">
              <p>Dear ${params.guestName},</p>
              <p>Thank you for your payment. This email serves as your receipt.</p>
              
              <div class="amount">
                ${params.currency.toUpperCase()} ${params.amount.toFixed(2)}
              </div>
              
              <div class="receipt-details">
                <h2>Payment Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Payment ID:</span>
                  <span class="detail-value">${params.paymentId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${params.bookingId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Property:</span>
                  <span class="detail-value">${params.propertyTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <p>If you have any questions about this payment, please contact our support team.</p>
              <p>Thank you for choosing HabibiStay!</p>
              <p>The HabibiStay Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HabibiStay. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `Payment Receipt - ${params.propertyTitle}`,
      html,
    });
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(params: {
    to: string;
    guestName: string;
    propertyTitle: string;
    bookingId: string;
    refundAmount?: number;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 0.9em; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
              <p>Dear ${params.guestName},</p>
              <p>Your booking for <strong>${params.propertyTitle}</strong> has been cancelled.</p>
              
              <div class="details">
                <p><strong>Booking ID:</strong> ${params.bookingId}</p>
                ${params.refundAmount ? `<p><strong>Refund Amount:</strong> $${params.refundAmount.toFixed(2)}</p><p>Your refund will be processed within 5-10 business days.</p>` : ''}
              </div>
              
              <p>We're sorry to see you go. If you have any questions or concerns, please don't hesitate to contact us.</p>
              <p>We hope to serve you again in the future!</p>
              <p>The HabibiStay Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HabibiStay. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `Booking Cancelled - ${params.propertyTitle}`,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(params: {
    to: string;
    name: string;
    resetToken: string;
  }): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${params.resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2957c3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2957c3; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; color: #666; font-size: 0.9em; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Dear ${params.name},</p>
              <p>We received a request to reset your password for your HabibiStay account.</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
              </p>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.</p>
              </div>
              
              <p>The HabibiStay Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HabibiStay. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: 'Password Reset Request - HabibiStay',
      html,
    });
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(params: {
    to: string;
    name: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to HabibiStay</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2957c3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2957c3; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .features { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { padding: 10px 0; }
            .footer { text-align: center; color: #666; font-size: 0.9em; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to HabibiStay! 🎉</h1>
            </div>
            <div class="content">
              <p>Dear ${params.name},</p>
              <p>Welcome to HabibiStay - your gateway to amazing vacation rentals in Saudi Arabia and the GCC region!</p>
              
              <div class="features">
                <h2>What You Can Do:</h2>
                <div class="feature-item">✨ Discover properties through our unique video-first interface</div>
                <div class="feature-item">🏠 Book your dream vacation rental with ease</div>
                <div class="feature-item">💬 Get instant help from our AI assistant Sara</div>
                <div class="feature-item">⭐ Leave reviews and share your experiences</div>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">Start Exploring</a>
              </p>
              
              <p>If you have any questions, our support team is always here to help!</p>
              <p>Happy travels!</p>
              <p>The HabibiStay Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HabibiStay. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: 'Welcome to HabibiStay! 🎉',
      html,
    });
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Verify email service configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
