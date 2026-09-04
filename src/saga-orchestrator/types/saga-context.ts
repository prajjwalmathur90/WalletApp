import { ShardId, Transaction } from "../../shared/types/shared-types.js";

type PrismaTransactionClient = any;

export interface SagaContext {
  transaction?: Transaction;
  fromShardId: ShardId;
  toShardId: ShardId;
  fromUser: bigint;
  toUser: bigint;
  amount: bigint;
  idempotencyKey: string;
  fromQueryRunner?: PrismaTransactionClient;
  toQueryRunner?: PrismaTransactionClient;
  debitCommited?: boolean;
  creditCommited?: boolean;
  [key: string]: any;
}
