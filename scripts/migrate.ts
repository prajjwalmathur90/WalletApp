import { execSync } from "child_process";
import "dotenv/config";

function run() {
  try {
    console.log("🔄 Step 1: Migrating Shard 1 (Generating new migrations if any)...");
    // This uses DATABASE_SHARD1_URL natively from prisma7.config.ts
    execSync("npx prisma migrate dev", { stdio: "inherit" });

    console.log("\n🔄 Step 2: Deploying migrations to Shard 2...");
    // We override DATABASE_SHARD1_URL in the child process environment 
    // to trick Prisma into migrating Shard 2.
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_SHARD1_URL: process.env.DATABASE_SHARD2_URL,
      },
    });

    console.log("\n✅ All shards migrated successfully!");
  } catch (error) {
    console.error("❌ Migration failed", error);
    process.exit(1);
  }
}

run();
