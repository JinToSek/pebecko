import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateAdmin, authenticateUser } from '../middleware';

export async function GET(req: NextRequest) {
  // Authenticate user (can be either admin or regular user)
  const authResult = await authenticateUser(req);
  if (!authResult) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult) {
    return authResult;
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    const project = await prisma.project.create({
      data: { name, description }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (!authResult) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  try {
    const { id } = params;

    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}