import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

type PrismaClientWithAccelerate = ReturnType<typeof initPrismaClient>

function initPrismaClient() {
  return new PrismaClient().$extends(withAccelerate())
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientWithAccelerate | undefined
}

export const prisma = globalForPrisma.prisma ?? initPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma