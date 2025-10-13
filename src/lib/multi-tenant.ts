import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/app/lib/db';
import Org from '@/models/Org';
import User from '@/models/User';

export type UserRole = 'OWNER' | 'ADMIN' | 'AGENT';

export interface OrgContext {
  orgId: string;
  orgSlug: string;
  orgName: string;
}

export interface UserContext {
  userId: string;
  email: string;
  role: UserRole;
  orgId: string;
}

/**
 * Extract org context from request headers (set by middleware)
 */
export function getOrgFromRequest(request: NextRequest): { subdomain: string | null } {
  const subdomain = request.headers.get('x-org-subdomain');
  return { subdomain };
}

/**
 * Extract user context from request headers (set by middleware)
 */
export function getUserFromRequest(request: NextRequest): { 
  userOrgId: string | null; 
  userRole: UserRole | null;
} {
  const userOrgId = request.headers.get('x-user-orgid');
  const userRole = request.headers.get('x-user-role') as UserRole | null;
  return { userOrgId, userRole };
}

/**
 * Validate that the subdomain exists and return the org
 */
export async function validateOrgSubdomain(subdomain: string): Promise<OrgContext | null> {
  await connectToDB();
  
  const org = await Org.findOne({ slug: subdomain });
  
  if (!org) {
    return null;
  }
  
  return {
    orgId: org._id.toString(),
    orgSlug: org.slug,
    orgName: org.name
  };
}

/**
 * Validate that user belongs to the organization
 */
export async function validateUserBelongsToOrg(
  userId: string, 
  orgId: string
): Promise<boolean> {
  await connectToDB();
  
  const user = await User.findOne({ 
    _id: userId, 
    orgId: orgId 
  });
  
  return !!user;
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Role hierarchy check - OWNER > ADMIN > AGENT
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'OWNER': 3,
    'ADMIN': 2,
    'AGENT': 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Middleware helper to validate org context in API routes
 * Returns org context or error response
 */
export async function validateOrgContext(
  request: NextRequest
): Promise<{ org: OrgContext } | { error: NextResponse }> {
  const { subdomain } = getOrgFromRequest(request);
  const { userOrgId } = getUserFromRequest(request);
  
  // In development without subdomain, use user's org
  if (!subdomain && process.env.NODE_ENV === 'development' && userOrgId) {
    await connectToDB();
    const org = await Org.findById(userOrgId);
    if (!org) {
      return {
        error: NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      };
    }
    return {
      org: {
        orgId: org._id.toString(),
        orgSlug: org.slug,
        orgName: org.name
      }
    };
  }
  
  // Require subdomain in production
  if (!subdomain) {
    return {
      error: NextResponse.json(
        { error: 'Organization subdomain required' },
        { status: 400 }
      )
    };
  }
  
  // Validate subdomain exists
  const org = await validateOrgSubdomain(subdomain);
  if (!org) {
    return {
      error: NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    };
  }
  
  // Validate user belongs to this org
  if (userOrgId && userOrgId !== org.orgId) {
    return {
      error: NextResponse.json(
        { error: 'Access denied: You do not belong to this organization' },
        { status: 403 }
      )
    };
  }
  
  return { org };
}

/**
 * Validate user has required role
 */
export function validateRole(
  userRole: UserRole | null,
  requiredRoles: UserRole[]
): { authorized: boolean; error?: NextResponse } {
  if (!userRole) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'User role not found' },
        { status: 401 }
      )
    };
  }
  
  if (!hasRole(userRole, requiredRoles)) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    };
  }
  
  return { authorized: true };
}

/**
 * Validate user has minimum role level
 */
export function validateMinimumRole(
  userRole: UserRole | null,
  minimumRole: UserRole
): { authorized: boolean; error?: NextResponse } {
  if (!userRole) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'User role not found' },
        { status: 401 }
      )
    };
  }
  
  if (!hasMinimumRole(userRole, minimumRole)) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: `Requires ${minimumRole} role or higher` },
        { status: 403 }
      )
    };
  }
  
  return { authorized: true };
}

