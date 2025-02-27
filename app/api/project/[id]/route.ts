import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateAdmin } from "../../middleware";

type Params = Promise<{ id: string }>

export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult) {
    return authResult;
  }

  try {
    const { id } = await params;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
