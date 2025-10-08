import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/app/lib/db';
import User from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// Force Node.js runtime (required for crypto module used by JWT)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    
    // Get token from request
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }
    
    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get user from database
    const user = await User.findById(payload.userId).populate('orgId');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        orgName: user.orgId?.name || 'Unknown Organization'
      }
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
