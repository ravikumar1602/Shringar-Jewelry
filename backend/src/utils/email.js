'use strict';

const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (err) {
    logger.error(`Email send failed: ${err.message}`);
    throw err;
  }
};

const emailTemplates = {
  orderConfirmation: (order, user) => ({
    subject: `Order Confirmed - #${order.orderNumber} | Shringar Jewelry`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <div style="background:#c8a96e;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;">✨ Shringar Jewelry</h1>
        </div>
        <div style="padding:20px;">
          <h2>Order Confirmed! 🎉</h2>
          <p>Dear ${user.name},</p>
          <p>Thank you for your order. Your order <strong>#${order.orderNumber}</strong> has been confirmed.</p>
          <div style="background:#f9f9f9;padding:15px;border-radius:6px;margin:15px 0;">
            <h3 style="margin-top:0;">Order Summary</h3>
            ${order.items.map(item => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                <span>${item.product.name} x${item.quantity}</span>
                <span>₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
            <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:bold;font-size:1.1em;">
              <span>Total</span>
              <span>₹${order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <p>We'll notify you when your order is shipped.</p>
          <p>Warm regards,<br/><strong>Team Shringar Jewelry</strong></p>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (user) => ({
    subject: 'Welcome to Shringar Jewelry! ✨',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h1 style="color:#c8a96e;">Welcome to Shringar Jewelry!</h1>
        <p>Dear ${user.name},</p>
        <p>Thank you for joining our family. Explore our exquisite collection of handcrafted jewelry.</p>
        <p>Happy Shopping!<br/><strong>Team Shringar</strong></p>
      </div>
    `,
  }),

  passwordReset: (resetUrl) => ({
    subject: 'Password Reset Request | Shringar Jewelry',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password. This link expires in 10 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#c8a96e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
