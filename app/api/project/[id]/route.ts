import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type ParamsContext = {
  params: {
    id: string;
  };
};

export async function DELETE(
  req: NextRequest,
  { params }: ParamsContext
): Promise<NextResponse> {
  try {
    const { id } = params;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
