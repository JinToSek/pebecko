import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type Props = {
  params: { id: string }
}

export async function DELETE(
  req: NextRequest,
  props: Props
): Promise<NextResponse> {
  try {
    const { id } = props.params;

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
