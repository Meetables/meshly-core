const nodemailer = require("nodemailer");

const { ENV_VARS } = require("../config/env-vars");

async function sendMail(to, subject, content) {
    const transporter = nodemailer.createTransport({
        host: ENV_VARS.CONFIRMATION_MAILING.SMTP_HOST,
        port: ENV_VARS.CONFIRMATION_MAILING.SMTP_PORT,
        secure: ENV_VARS.CONFIRMATION_MAILING.SMTP_SECURE,
        auth: {
            user: ENV_VARS.CONFIRMATION_MAILING.SMTP_USERNAME,
            pass: ENV_VARS.CONFIRMATION_MAILING.SMTP_PASSWORD
        }
    });

    await transporter.sendMail({
        from: ENV_VARS.CONFIRMATION_MAILING.SMTP_FROM,
        to,
        subject,
        html: content
    });
}

async function sendConfirmationEmail(email, confirmationUrl) {
    const subject = "Confirm your account";
    const content = `
        <h1>Welcome to Meshly!</h1>
        <p>Thank you for signing up. Please confirm your email address by clicking the link below:</p>
        <a href="${confirmationUrl}">Confirm Email</a>
        <p>If you did not sign up, please ignore this email.</p>
        <p>If the link doesn't work, copy and paste this URL into your browser:</p>
        <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
    `;
    try {
        await sendMail(email, subject, content);
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send confirmation email to ${email}:`, error);
    }
}

module.exports = { sendMail, sendConfirmationEmail };