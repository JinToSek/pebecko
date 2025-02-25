import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAdmin } from "../middleware";

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { votes: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await authenticateAdmin(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const { name, description } = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: { name, description },
    });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}