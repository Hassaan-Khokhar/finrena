import { prisma } from '../config/db';
import { logger } from '../utils/logger';

async function enableRLS() {
  logger.info('Enabling Row Level Security (RLS) on all public tables...');

  const tables = ['users', 'refresh_tokens', 'debate_dossiers'];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."${table}" ENABLE ROW LEVEL SECURITY;`);
    logger.info(`✅ Enabled RLS on public.${table}`);
  }

  logger.info('All tables secured with RLS.');
  await prisma.$disconnect();
}

enableRLS().catch((err) => {
  logger.error('Failed to enable RLS:', err);
  process.exit(1);
});
