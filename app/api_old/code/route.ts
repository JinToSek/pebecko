import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAdmin } from "../middleware";

const validateCodeSchema = z.object({
  code: z.string().min(1),
});

const submitVoteSchema = z.object({
  code: z.string().min(1),
  projectIds: z.array(z.string()).min(1).max(3),
});

const createCodeSchema = z.object({
  code: z.string().min(1),
});

const createBulkCodesSchema = z.object({
  codes: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  try {
    const codes = await prisma.code.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(codes);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = validateCodeSchema.parse(body);

    const codeRecord = await prisma.code.findUnique({
      where: { code },
    });

    if (!codeRecord) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (codeRecord.disabled) {
      return NextResponse.json({ error: "Code is disabled" }, { status: 400 });
    }

    return NextResponse.json({
      id: codeRecord.id,
      isAdmin: codeRecord.isAdmin
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, projectIds } = submitVoteSchema.parse(body);

    const codeRecord = await prisma.code.findUnique({
      where: { code },
    });

    if (!codeRecord || codeRecord.disabled) {
      return NextResponse.json({ error: "Invalid or disabled code" }, { status: 400 });
    }

    // Create votes and disable the code in a transaction
    await prisma.$transaction(async (tx: { vote: { createMany: (arg0: { data: { codeId: any; projectId: string; }[]; }) => any; }; code: { update: (arg0: { where: { id: any; }; data: { disabled: boolean; }; }) => any; }; }) => {
      await tx.vote.createMany({
        data: projectIds.map((projectId) => ({
          codeId: codeRecord.id,
          projectId,
        })),
      });

      await tx.code.update({
        where: { id: codeRecord.id },
        data: { disabled: true },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authError = await authenticateAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const { code } = createCodeSchema.parse(body);

    const newCode = await prisma.code.create({
      data: { code },
    });

    return NextResponse.json(newCode);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = await authenticateAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const { codes } = createBulkCodesSchema.parse(body);

    const newCodes = await prisma.code.createMany({
      data: codes.map((code) => ({ code })),
    });

    return NextResponse.json({ count: newCodes.count });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}