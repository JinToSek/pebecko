import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateAdmin, authenticateUser } from "../middleware";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  const params = await context.params;
  const id = params?.id;
  // Authenticate user
  const authResult = await authenticateUser(req);
  if (!authResult) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Check if we have an ID parameter
    if (id) {
      // Fetch a single project by ID
      const project = await prisma.project.findUnique({
        where: { id: id },
        include: {
          _count: {
            select: { votes: true },
          },
        },
      });

      // Ensure we return a valid JSON object even if project is null
      return NextResponse.json(project || { error: "Project not found" });
    }

    // If no ID is provided, fetch all projects
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });
    // Ensure we return a valid JSON array even if projects is empty
    return NextResponse.json(projects || []);
  } catch (error) {
    console.error("Error fetching project(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch project data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult !== null) {
    return authResult;
  }

  try {
    const { name, description } = await req.json();

    const project = await prisma.project.create({
      data: { name, description },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// DELETE functionality is handled in [id]/route.ts
