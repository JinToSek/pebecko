import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function authenticateAdmin(req: NextRequest) {
  const headersList = await headers();
  const code = headersList.get("x-auth-code");

  if (!code) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const codeRecord = await prisma.code.findUnique({
      where: { code },
    });

    if (!codeRecord) {
      return NextResponse.json(
        { error: "Tento kód neexistuje." },
        { status: 401 }
      );
    }

    if (codeRecord.disabled) {
      return NextResponse.json(
        {
          error:
            "Tento kód už byl použitej. " +
            "Pokuď je tento kód váš a ještě jste nehlasovali," +
            " můžete kontaktovat organizaci.",
        },
        { status: 401 }
      );
    }

    if (!codeRecord.isAdmin) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    return null; // Authentication successful
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function authenticateUser(req: NextRequest) {
  const headersList = await headers();
  const code = headersList.get("x-auth-code");

  if (!code) return false;

  try {
    const codeRecord = await prisma.code.findUnique({
      where: { code },
    });
    return codeRecord !== null;
  } catch (error) {
    console.error("Authentication error:", error);
    return false;
  }
}
