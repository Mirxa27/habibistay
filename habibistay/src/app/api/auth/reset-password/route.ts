import { NextResponse } from 'next/server';
import prisma from '@habibistay/lib/prisma'; // Assumes @/ maps to habibistay/src
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // 1. Validate input
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    // Validate new password length (example: min 6 characters)
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // 2. Find the reset token
    // For security, it's better to hash the token before storing and then hash the input token for lookup.
    // However, the current plan stores raw tokens, so we look up raw token.
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token: token },
    });

    if (!passwordResetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // 3. Check if token is expired
    if (new Date() > new Date(passwordResetToken.expiresAt)) {
      // Optionally delete expired token
      await prisma.passwordResetToken.delete({ where: { id: passwordResetToken.id } });
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // 4. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12); // Using 12 salt rounds like in registration

    // 5. Update user's password
    await prisma.user.update({
      where: { id: passwordResetToken.userId },
      data: { password: hashedPassword },
    });

    // 6. Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: passwordResetToken.id },
    });

    // 7. Return success response
    return NextResponse.json({ message: 'Password has been reset successfully' }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    // It's good practice to check for specific Prisma errors if needed, e.g., record not found during update/delete
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
