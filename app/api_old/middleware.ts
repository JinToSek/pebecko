import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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