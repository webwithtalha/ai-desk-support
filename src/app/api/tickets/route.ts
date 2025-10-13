import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/app/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { validateOrgContext, validateMinimumRole, getUserFromRequest } from '@/lib/multi-tenant';

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * GET /api/tickets
 * Get all tickets for the organization
 * Requires: AGENT role or higher
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
    
    // Check user role (minimum AGENT)
    const { userRole } = getUserFromRequest(request);
    const roleCheck = validateMinimumRole(userRole, 'AGENT');
    if (!roleCheck.authorized) {
      return roleCheck.error;
    }
    
    // TODO: Query tickets collection scoped to org.orgId
    // Example: const tickets = await Ticket.find({ orgId: org.orgId });
    
    return NextResponse.json({
      message: 'Tickets retrieved successfully',
      org: org.orgName,
      tickets: [] // Replace with actual tickets
    });
    
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 * Requires: ADMIN role or higher
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
    
    // Check user role (minimum ADMIN)
    const { userRole } = getUserFromRequest(request);
    const roleCheck = validateMinimumRole(userRole, 'ADMIN');
    if (!roleCheck.authorized) {
      return roleCheck.error;
    }
    
    const body = await request.json();
    
    // TODO: Create ticket with orgId
    // Example: const ticket = await Ticket.create({ ...body, orgId: org.orgId });
    
    return NextResponse.json({
      message: 'Ticket created successfully',
      org: org.orgName,
      ticket: { ...body, orgId: org.orgId } // Replace with actual ticket
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

