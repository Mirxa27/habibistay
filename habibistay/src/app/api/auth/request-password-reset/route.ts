import { NextResponse } from 'next/server';
import prisma from '@habibistay/lib/prisma'; // Assumes @/ maps to habibistay/src
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User found, proceed to generate and store token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

      // Invalidate any existing tokens for this user (optional, but good practice)
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: token, // Storing token directly for now. Hashing it is a more secure practice.
          expiresAt: expiresAt,
        },
      });

      // --- BEGIN EMAIL SENDING LOGIC (Subtask 6.4 Placeholder) ---
      // In a full implementation, you would integrate an email service like Resend here.
      // 1. Import the email sending library (e.g., `import { Resend } from 'resend';`)
      // 2. Initialize the client (e.g., `const resend = new Resend(process.env.RESEND_API_KEY);`)
      // 3. Construct the reset URL (e.g., `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`)
      // 4. Define email content (HTML or text). Example:
      //    Subject: "Password Reset Request for HabibiStay"
      //    Body: `Hello, you requested a password reset. 
      //           Click this link to reset your password: ${resetUrl}
      //           This link is valid for 1 hour. 
      //           If you did not request this, please ignore this email.`
      // 5. Send the email:
      //    try {
      //      await resend.emails.send({
      //        from: process.env.EMAIL_FROM || 'HabibiStay <no-reply@yourdomain.com>',
      //        to: user.email,
      //        subject: 'Password Reset Request for HabibiStay',
      //        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link is valid for 1 hour.</p>`, // Or use React Email
      //      });
      //      console.log(`Password reset email successfully initiated for ${email}`);
      //    } catch (emailError) {
      //      console.error(`Failed to send password reset email to ${email}:`, emailError);
      //      // Potentially handle this error, e.g., by not invalidating the token immediately or logging for retry
      //    }
      // For now, logging to console:
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      console.log(`SIMULATING EMAIL SEND: Password reset token for ${email}: ${token}`);
      console.log(`SIMULATING EMAIL SEND: Reset link: ${resetUrl}`);
      // --- END EMAIL SENDING LOGIC (Subtask 6.4 Placeholder) ---
    } else {
      // User not found, but we don't want to reveal this.
      // Log this attempt for security monitoring if desired.
      console.log(`Password reset requested for non-existent email: ${email}`);
    }

    // Always return a generic success message to prevent email enumeration
    return NextResponse.json({ message: 'If your email address is in our system, you will receive a password reset link shortly.' }, { status: 200 });

  } catch (error) {
    console.error('Request password reset error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
