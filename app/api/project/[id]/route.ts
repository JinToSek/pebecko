import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateAdmin } from "../../middleware";

type Params = Promise<{ id: string }>;

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult !== null) {
    return authResult;
  }

  try {
    const { id } = await params;

    // First check if the project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        votes: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projekt neexistuje." },
        { status: 404 }
      );
    }

    // Delete associated votes first
    if (project.votes.length > 0) {
      await prisma.vote.deleteMany({
        where: { projectId: id },
      });
    }

    // Now delete the project
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project. Please try again later." },
      { status: 500 }
    );
  }
}
