import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDB } from '@/app/lib/db';
import User from '@/models/User';
import Org from '@/models/Org';
import { registerSchema } from '@/lib/validations';

// Force Node.js runtime (required for crypto module used by JWT)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    const { name, orgName, email, password } = validatedData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create default organization for the user
    let orgSlug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Ensure slug is unique
    let counter = 1;
    let finalSlug = orgSlug;
    while (await Org.findOne({ slug: finalSlug })) {
      finalSlug = `${orgSlug}-${counter}`;
      counter++;
    }
    
    const defaultOrg = new Org({
      name: orgName,
      slug: finalSlug,
      plan: 'FREE'
    });
    await defaultOrg.save();
    
    // Create user
    const user = new User({
      orgId: defaultOrg._id,
      name,
      email,
      hashedPassword,
      role: 'OWNER'
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        orgId: user.orgId.toString(),
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1h' }
    );
    
    // Return success response with token and org subdomain
    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          orgName: defaultOrg.name,
          orgSlug: defaultOrg.slug
        },
        // Include org slug for client-side redirect to subdomain
        redirectTo: defaultOrg.slug
      },
      { status: 201 }
    );
    
    // Set token as HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
