import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/app/lib/db';
import User from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { validateOrgContext, validateMinimumRole, getUserFromRequest } from '@/lib/multi-tenant';

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * GET /api/users
 * Get all users in the organization
 * Requires: ADMIN role or higher
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    
    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Validate org context
    const orgValidation = await validateOrgContext(request);
    if ('error' in orgValidation) {
      return orgValidation.error;
    }
    const { org } = orgValidation;
    
    // Check user role (minimum ADMIN)
    const { userRole } = getUserFromRequest(request);
    const roleCheck = validateMinimumRole(userRole, 'ADMIN');
    if (!roleCheck.authorized) {
      return roleCheck.error;
    }
    
    // Get all users in this organization (scoped query)
    const users = await User.find({ orgId: org.orgId }).select('-hashedPassword');
    
    return NextResponse.json({
      message: 'Users retrieved successfully',
      org: org.orgName,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Create a new user in the organization (invite)
 * Requires: OWNER role
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    
    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Validate org context
    const orgValidation = await validateOrgContext(request);
    if ('error' in orgValidation) {
      return orgValidation.error;
    }
    const { org } = orgValidation;
    
    // Check user role (OWNER only)
    const { userRole } = getUserFromRequest(request);
    const roleCheck = validateMinimumRole(userRole, 'OWNER');
    if (!roleCheck.authorized) {
      return roleCheck.error;
    }
    
    const body = await request.json();
    const { name, email, role } = body;
    
    // Validate role
    if (!['ADMIN', 'AGENT'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN or AGENT' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // TODO: In a real app, you'd:
    // 1. Generate a temporary password or invite token
    // 2. Send an invitation email
    // 3. Create the user with a pending status
    
    return NextResponse.json({
      message: 'User invitation sent successfully',
      org: org.orgName,
      user: { name, email, role, orgId: org.orgId }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

