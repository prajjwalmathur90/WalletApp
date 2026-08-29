import { ShardId } from "../types/shared-types.js";
export class ShardResolver {
    static getShardId(userId) {
        const userIdNum = typeof userId === "bigint" ? Number(userId) : userId;
        const shardId = userIdNum % 2 == 0 ? ShardId.SHARD_1 : ShardId.SHARD_2;
        return shardId;
    }
    static getShardName(userId) {
        const shardId = this.getShardId(userId);
        return shardId == ShardId.SHARD_1 ? "shard1" : "shard2";
    }
    static areOnSameShard(userId1, userId2) {
        return this.getShardId(userId1) == this.getShardId(userId2);
    }
}
//# sourceMappingURL=shard-resolver.js.map