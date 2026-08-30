import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { LedgerType, LedgerEntry } from "../types/shared-types.js";

export class LedgerRepository {
  async create(
    userId: bigint,
    transactionId: bigint,
    amount: bigint,
    type: LedgerType,
    tx: Prisma.TransactionClient,
  ): Promise<LedgerEntry> {
    const ledgerEntity = await tx.ledger.create({
      data: {
        user_id: userId,
        transaction_id: transactionId,
        amount,
        type,
      },
    });

    return this.mapToLedgerEntry(ledgerEntity);
  }

  async findById(
    ledgerId: bigint,
    tx: PrismaClient | Prisma.TransactionClient,
  ): Promise<LedgerEntry | null> {
    const ledgerEntity = await tx.ledger.findUnique({
      where: { id: ledgerId },
    });

    return ledgerEntity ? this.mapToLedgerEntry(ledgerEntity) : null;
  }

  async getHistory(
    userId: bigint,
    tx: PrismaClient | Prisma.TransactionClient,
  ): Promise<LedgerEntry[]> {
    const ledgerEntries = await tx.ledger.findMany({
      where: {
        id: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ledgerEntries.map((entity) => this.mapToLedgerEntry(entity));
  }

  private mapToLedgerEntry(entity: {
    id: bigint;
    user_id: bigint;
    transaction_id: bigint;
    amount: bigint;
    type: LedgerType | string;
    createdAt: Date;
  }): LedgerEntry {
    const type = entity.type as LedgerType;

    return {
      id: BigInt(entity.id.toString()),
      user_id: BigInt(entity.user_id.toString()),
      transaction_id: BigInt(entity.transaction_id.toString()),
      amount: BigInt(entity.amount.toString()),
      type: type,
      created_at: entity.createdAt,
    };
  }
}
