import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma-new';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success message (for security reasons)
    const successResponse = NextResponse.json(
      { message: 'If an account with that email exists, we have sent a password reset link.' },
      { status: 200 }
    );

    if (!user) {
      return successResponse;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Setup email transporter (using Gmail as example)
    // Note: In production, use proper email service like SendGrid, AWS SES, etc.
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use app password for Gmail
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@navaai.com',
      to: email,
      subject: 'Password Reset Request - NavaAI Studio',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4f46e5;">NavaAI Studio</h1>
          </div>
          
          <h2 style="color: #333;">Password Reset Request</h2>
          
          <p>Hello,</p>
          
          <p>You have requested to reset your password for your NavaAI Studio account. Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          
          <p>If you did not request this password reset, please ignore this email.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>Best regards,<br>NavaAI Studio Team</p>
          </div>
        </div>
      `
    };

    // Send email (only if EMAIL_USER is configured)
    if (process.env.EMAIL_USER) {
      try {
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails - log for debugging
      }
    } else {
      // Email not configured - in production, log securely
    }

    return successResponse;

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}