import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { Transaction, TransactionStatus } from "../types/shared-types.js";

export class TransactionRepository {
  async create(
    fromUser: bigint,
    toUser: bigint,
    amount: bigint,
    idempotencyKey: string,
    tx: PrismaClient | Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const transactionEntity = await tx.transaction.create({
      data: {
        from_user: fromUser,
        to_user: toUser,
        amount,
        status: TransactionStatus.PENDING,
        idempotency_key: idempotencyKey,
      },
    });

    return this.mapToTransaction(transactionEntity);
  }

  async findById(
    transactionId: bigint,
    tx: PrismaClient | Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const transactionEntity = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    return transactionEntity ? this.mapToTransaction(transactionEntity) : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    tx: PrismaClient | Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const transactionEntity = await tx.transaction.findUnique({
      where: { idempotency_key: idempotencyKey },
    });

    return transactionEntity ? this.mapToTransaction(transactionEntity) : null;
  }

  async updateStatus(
    transactionId: bigint,
    status: TransactionStatus,
    tx: PrismaClient | Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const transactionEntity = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: status as any },
    });

    return transactionEntity ? this.mapToTransaction(transactionEntity) : null;
  }

  async getHistory(
    userId: bigint,
    client1: PrismaClient,
    client2: PrismaClient,
  ): Promise<Transaction[]> {
    const [transaction1, transaction2] = await Promise.all([
      client1.transaction.findMany({
        where: {
          OR: [{ from_user: userId }, { to_user: userId }],
        },
        orderBy: { createdAt: "desc" },
      }),
      client2.transaction.findMany({
        where: {
          OR: [{ from_user: userId }, { to_user: userId }],
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const transactionEntities = [...transaction1, ...transaction2];
    const allTransactions = transactionEntities.map((entity) =>
      this.mapToTransaction(entity),
    );

    return allTransactions.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime(),
    );
  }

  private mapToTransaction(entity: {
    id: bigint;
    from_user: bigint;
    to_user: bigint;
    amount: bigint;
    status: string | TransactionStatus;
    idempotency_key: string;
    createdAt: Date;
  }): Transaction {
    const status = entity.status as TransactionStatus;

    return {
      id: BigInt(entity.id.toString()),
      from_user: BigInt(entity.from_user.toString()),
      to_user: BigInt(entity.to_user.toString()),
      amount: BigInt(entity.amount.toString()),
      status: status,
      indempotency_key: entity.idempotency_key,
      created_at: entity.createdAt,
    };
  }
}
