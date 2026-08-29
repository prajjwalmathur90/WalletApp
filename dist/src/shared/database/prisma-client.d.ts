import { PrismaClient } from "../../generated/prisma/client.js";
import { ShardId } from "../types/shared-types.js";
export declare function getShard1Client(): PrismaClient;
export declare function getShard2Client(): PrismaClient;
export declare function getPrismaClient(shardId: ShardId): PrismaClient;
export declare function closePrimsaClient(): Promise<void>;
//# sourceMappingURL=prisma-client.d.ts.map