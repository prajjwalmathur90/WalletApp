import { ShardId } from "../types/shared-types.js";
import { getPrismaClient } from "./prisma-client.js";
import { Prisma, PrismaClient } from "../../generated/prisma/client.js";

export class ConnectionManager {
  static getClient(shardId: ShardId): PrismaClient {
    return getPrismaClient(shardId);
  }

  static async executeTransaction<T>(
    shardId: ShardId,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const client = getPrismaClient(shardId);

    return await client.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
  }
}

export const connectionManager = new ConnectionManager();
