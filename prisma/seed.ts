const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Create admin code if it doesn't exist
  const adminCode = await prisma.code.upsert({
    where: { code: 'ADMIN' },
    update: { isAdmin: true },
    create: {
      code: 'ADMIN',
      isAdmin: true,
    },
  })

  console.log({ adminCode })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })