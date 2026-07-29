-- Align ide_workspaces with Drizzle schema (no format column; status is the lifecycle field).
ALTER TABLE "ide_workspaces" DROP COLUMN IF EXISTS "format";
