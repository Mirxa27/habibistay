import { NextResponse } from 'next/server';
import prisma from '@habibistay/lib/prisma'; // Assumes @/ maps to habibistay/src
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }); // User not found
    }

    if (!user.password) {
      // This case might happen if user signed up via OAuth and doesn't have a password
      return NextResponse.json({ error: 'Login with password not available for this account. Try a different login method.' }, { status: 403 });
    }

    // 3. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }); // Incorrect password
    }

    // 4. If valid, return user data (sans password)
    // Token generation will be handled in subtask 3.4
    // For now, just confirm authentication is successful
    const { password: _, ...userWithoutPassword } = user;

    // 5. Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const token = jwt.sign(
      { 
        userId: userWithoutPassword.id,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role 
      },
      jwtSecret,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    return NextResponse.json({ 
      message: 'Login successful', 
      user: userWithoutPassword,
      token: token
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login.' }, { status: 500 });
  }
}
