import { ShardId } from "../types/shared-types.js";
export declare class ShardResolver {
    static getShardId(userId: bigint | number): ShardId;
    static getShardName(userId: bigint | number): string;
    static areOnSameShard(userId1: bigint | number, userId2: bigint | number): boolean;
}
//# sourceMappingURL=shard-resolver.d.ts.map