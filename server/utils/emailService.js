import nodemailer from 'nodemailer';

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
        rejectUnauthorized: false
    }
    });
};

export const sendVerificationEmail = async (email, name, token) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: `Rendezvous <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - Rendezvous',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #0b2027; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #028090; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #fafaf9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background-color: #028090; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                .warning { background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-family: 'Geologica', sans-serif;">Verify Your Email</h1>
                </div>
                <div class="content">
                    <p>Hi ${name},</p>
                    <p>Thank you for registering with Rendezvous! Please verify your email address to complete your account setup.</p>
                    <p style="text-align: center;">
                        <a href="${verificationUrl}" class="button">Verify Email Address</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #028090;">${verificationUrl}</p>
                    <div class="warning">
                        <strong>Important:</strong> This verification link will expire in 24 hours.
                    </div>
                    <p>If you didn't create a Rendezvous account, please ignore this email.</p>
                    <p>Best regards,<br>The Rendezvous Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to ${email}</p>
                    <p>Rendezvous - Discover Events in Cameroon</p>
                </div>
            </div>
        </body>
        </html>
    `,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: `Rendezvous <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Rendezvous Password',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #0b2027; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #63132b; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #fafaf9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background-color: #028090; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                .warning { background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ef4444; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-family: 'Geologica', sans-serif;">Reset Your Password</h1>
                </div>
                <div class="content">
                    <p>Hi ${name},</p>
                    <p>You requested to reset your Rendezvous account password. Click the button below to reset it:</p>
                    <p style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #028090;">${resetUrl}</p>
                    <div class="warning">
                        <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security.
                    </div>
                    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                    <p>Best regards,<br>The Rendezvous Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to ${email}</p>
                    <p>Rendezvous - Discover Events in Cameroon</p>
                </div>
            </div>
        </body>
        </html>
    `,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
};


export const sendWelcomeEmail = async (email, name) => {
    const mailOptions = {
        from: `Rendezvous <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to Rendezvous!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #0b2027; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #10b981; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #fafaf9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background-color: #028090; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                .success { background-color: #d1fae5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-family: 'Geologica', sans-serif;">Email Verified!</h1>
                </div>
                <div class="content">
                    <p>Hi ${name},</p>
                    <div class="success">
                        <strong>Success!</strong> Your email address has been verified.
                    </div>
                    <p>You now have full access to all Rendezvous features:</p>
                    <ul>
                        <li>Discover personalized events</li>
                        <li>Save and track events</li>
                        <li>Follow organizers</li>
                        <li>Leave reviews and ratings</li>
                        <li>Receive event reminders</li>
                    </ul>
                    <p style="text-align: center;">
                        <a href="${process.env.CLIENT_URL}/events" class="button">Start Exploring Events</a>
                    </p>
                    <p>Best regards,<br>The Rendezvous Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to ${email}</p>
                    <p>Rendezvous - Discover Events in Cameroon</p>
                </div>
            </div>
        </body>
        </html>
    `,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
};