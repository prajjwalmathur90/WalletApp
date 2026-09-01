import { ConnectionManager } from "../shared/database/connection-manager.js";
import { ShardResolver } from "../shared/database/shard-resolver.js";
import { TransactionRepository } from "../shared/repositories/transaction.repository.js";
import {
  ShardId,
  Transaction,
  TransactionStatus,
} from "../shared/types/shared-types.js";

export class TransactionService {
  private transactionRepository: TransactionRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
  }

  async createTransaction(
    fromUser: bigint,
    toUser: bigint,
    amount: bigint,
    idempotencyKey: string,
  ): Promise<Transaction> {
    const shardId = ShardResolver.getShardId(fromUser);

    return await ConnectionManager.executeTransaction(shardId, async (tx) => {
      const existing = await this.transactionRepository.findByIdempotencyKey(
        idempotencyKey,
        tx,
      );
      if (existing) {
        return existing;
      }

      return await this.transactionRepository.create(
        fromUser,
        toUser,
        amount,
        idempotencyKey,
        tx,
      );
    });
  }

  async updateTransaction(
    transactionId: bigint,
    status: TransactionStatus,
    fromUser: bigint,
  ): Promise<Transaction> {
    const shardId = ShardResolver.getShardId(fromUser);

    return await ConnectionManager.executeTransaction(shardId, async (tx) => {
      const transaction = await this.transactionRepository.updateStatus(
        transactionId,
        status,
        tx,
      );
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      return transaction;
    });
  }

  async getHistory(userId: bigint): Promise<Transaction[]> {
    const client1 = ConnectionManager.getClient(ShardId.SHARD_1);
    const client2 = ConnectionManager.getClient(ShardId.SHARD_2);
    return await this.transactionRepository.getHistory(
      userId,
      client1,
      client2,
    );
  }

  async getTransactionByIdempotencyKey(
    idempotencyKey: string,
    fromUser: bigint,
  ): Promise<Transaction | null> {
    const shardId = ShardResolver.getShardId(fromUser);
    const client = ConnectionManager.getClient(shardId);

    return await this.transactionRepository.findByIdempotencyKey(
      idempotencyKey,
      client,
    );
  }

  async getTransaction(
    transactionId: bigint,
    fromUser: bigint,
  ): Promise<Transaction | null> {
    const shardId = ShardResolver.getShardId(fromUser);
    const client = ConnectionManager.getClient(shardId);

    return await this.transactionRepository.findById(transactionId, client);
  }
}
