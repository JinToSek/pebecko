import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function authenticateAdmin(req: NextRequest) {
  const code = req.headers.get("x-auth-code");

  if (!code) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const codeRecord = await prisma.code.findUnique({
      where: { code },
    });

    if (!codeRecord || codeRecord.disabled) {
      return NextResponse.json({ error: "Invalid or disabled code" }, { status: 401 });
    }

    if (!codeRecord.isAdmin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }

    return null; // Authentication successful
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function authenticateUser(req: NextRequest) {
  const code = req.headers.get('x-auth-code');
  if (!code) return false;

  try {
    const codeRecord = await prisma.code.findFirst({
      where: { code: code }
    });
    return codeRecord !== null;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}