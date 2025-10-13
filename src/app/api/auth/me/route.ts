import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/app/lib/db';
import User from '@/models/User';
import Org from '@/models/Org';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { validateOrgContext } from '@/lib/multi-tenant';

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
    
    // Validate org context (multi-tenant)
    const orgValidation = await validateOrgContext(request);
    if ('error' in orgValidation) {
      return orgValidation.error;
    }
    const { org } = orgValidation;
    
    // Get user from database (scoped to org)
    const user = await User.findOne({ 
      _id: payload.userId,
      orgId: org.orgId 
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in this organization' },
        { status: 404 }
      );
    }
    
    // Get organization details
    const orgDetails = await Org.findById(user.orgId);
    
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        orgName: orgDetails?.name || 'Unknown Organization',
        orgSlug: orgDetails?.slug || ''
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
