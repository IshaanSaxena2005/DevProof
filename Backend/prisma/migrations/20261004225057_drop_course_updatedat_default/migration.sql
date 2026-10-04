-- The preceding migration added "updatedAt" with a default so it could be
-- applied to a table that already had rows. Prisma manages @updatedAt itself,
-- so the schema declares no default and the column drifts from it until the
-- default is removed. Dropping it here keeps both properties: that migration
-- stays safe to apply, and the resulting schema matches schema.prisma.
ALTER TABLE "courses" ALTER COLUMN "updatedAt" DROP DEFAULT;
