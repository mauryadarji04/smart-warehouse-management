import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@warehouse.com' },
    update: {},
    create: {
      email: 'admin@warehouse.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // Seed a supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: 'seed-supplier-1' },
    update: {},
    create: {
      id: 'seed-supplier-1',
      name: 'Default Supplier Co.',
      email: 'supplier@example.com',
      leadTimeDays: 5,
    },
  });

  // Seed sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'SKU-001' },
      update: {},
      create: {
        sku: 'SKU-001',
        name: 'Widget A',
        category: 'Electronics',
        unit: 'pcs',
        costPrice: 10,
        sellingPrice: 25,
        reorderPoint: 20,
        reorderQty: 100,
        orderingCost: 50,
        holdingCost: 2,
        avgDailyDemand: 5,
        supplierId: supplier.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU-002' },
      update: {},
      create: {
        sku: 'SKU-002',
        name: 'Gadget B',
        category: 'Tools',
        unit: 'pcs',
        costPrice: 30,
        sellingPrice: 75,
        reorderPoint: 10,
        reorderQty: 50,
        orderingCost: 75,
        holdingCost: 5,
        avgDailyDemand: 2,
        supplierId: supplier.id,
      },
    }),
  ]);

  // Seed initial inventory
  for (const product of products) {
    await prisma.inventory.upsert({
      where: { id: `inv-${product.id}` },
      update: {},
      create: {
        id: `inv-${product.id}`,
        productId: product.id,
        quantity: 50,
        batchNo: 'BATCH-INITIAL',
      },
    });
  }

  console.log('✅ Seed complete');
  console.log(`   Admin: admin@warehouse.com / admin123`);
  console.log(`   Supplier: ${supplier.name}`);
  console.log(`   Products: ${products.map(p => p.sku).join(', ')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
