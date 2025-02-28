import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateAdmin } from "../middleware";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult !== null) {
    return authResult;
  }

  try {
    // Check if we have an ID parameter
    if (id) {
      if (id) {
        // Fetch a single code by ID
        const code = await prisma.code.findUnique({
          where: { id: id },
        });
        return NextResponse.json(code || { error: "Code not found" });
      }
    }

    // If no ID is provided, fetch all codes
    const codes = await prisma.code.findMany();
    return NextResponse.json(codes);
  } catch (error) {
    console.error("Error fetching code(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch codes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

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

    return NextResponse.json({ isAdmin: codeRecord.isAdmin });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult !== null) {
    return authResult;
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // Check if code already exists
    const existingCode = await prisma.code.findUnique({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Code already exists" },
        { status: 400 }
      );
    }

    const newCode = await prisma.code.create({
      data: {
        code,
        isAdmin: false,
        disabled: false,
      },
    });

    return NextResponse.json(newCode);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create code" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { code, projectIds } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: "At least one project must be selected" },
        { status: 400 }
      );
    }

    if (projectIds.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 projects can be selected" },
        { status: 400 }
      );
    }

    const codeRecord = await prisma.code.findUnique({
      where: { code },
      include: { votes: true },
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

    if (codeRecord.votes.length > 0) {
      return NextResponse.json(
        { error: "Code has already been used to vote" },
        { status: 400 }
      );
    }

    // Create votes for each project
    await prisma.$transaction([
      ...projectIds.map((projectId) =>
        prisma.vote.create({
          data: {
            projectId,
            codeId: codeRecord.id,
          },
        })
      ),
      prisma.code.update({
        where: { id: codeRecord.id },
        data: { disabled: true },
      }),
    ]);

    return NextResponse.json({ message: "Vote recorded successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult !== null) {
    return authResult;
  }

  try {
    const { codes } = await req.json();

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: "At least one code is required" },
        { status: 400 }
      );
    }

    // Create all codes in bulk
    const createdCodes = await prisma.$transaction(
      codes.map((code) =>
        prisma.code.create({
          data: {
            code,
            isAdmin: false,
            disabled: false,
          },
        })
      )
    );

    return NextResponse.json({
      message: "Codes created successfully",
      codes: createdCodes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create codes" },
      { status: 500 }
    );
  }
}
