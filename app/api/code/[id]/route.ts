import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateAdmin } from '../../middleware';

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult) {
    return authResult;
  }

  try {
    const { id } = context.params;

    // Delete all votes associated with this code first
    await prisma.vote.deleteMany({
      where: { codeId: id }
    });

    // Then delete the code
    await prisma.code.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Code deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate admin
  const authResult = await authenticateAdmin(req);
  if (authResult) {
    return authResult;
  }

  try {
    const { id } = params;
    const { disabled } = await req.json();

    const updatedCode = await prisma.code.update({
      where: { id },
      data: { disabled }
    });

    return NextResponse.json(updatedCode);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
  }
}