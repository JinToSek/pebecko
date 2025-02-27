import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "../../middleware";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await authenticateAdmin(req);
    if (authError) return authError;

    // Delete votes and code in a transaction
    await prisma.$transaction(async (tx) => {
      // Check if code exists first
      const code = await tx.code.findUnique({
        where: { id: params.id },
      });

      if (!code) {
        throw new Error('Code not found');
      }

      // Delete all votes associated with the code
      await tx.vote.deleteMany({
        where: { codeId: params.id },
      });

      // Delete the code
      await tx.code.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting code:', error);
    if (error instanceof Error && error.message === 'Code not found') {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'An error occurred while deleting the code' },
      { status: 500 }
    );
  }
}