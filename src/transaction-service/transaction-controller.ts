import { Request, Response } from "express";
import { TransactionService } from "./transaction.services.js";
import { SagaOrchestrator } from "../saga-orchestrator/services/saga-orchestrator.js";
import {
  TransferDTO,
  TransactionResponseDTO,
} from "../shared/dtos/transaction.dto.js";
import { Transaction } from "../shared/types/shared-types.js";

function tryParseBigintPathSegment(
  raw: string | undefined,
): { ok: true; value: bigint } | { ok: false } {
  if (raw === undefined || raw === "") {
    return { ok: false };
  }

  try {
    return { ok: true, value: BigInt(raw) };
  } catch {
    return { ok: false };
  }
}

function toTransactionResponseDTO(txn: Transaction): TransactionResponseDTO {
  return {
    id: txn.id.toString(),
    fromUser: txn.from_user.toString(),
    toUser: txn.to_user.toString(),
    amount: txn.amount.toString(),
    status: txn.status,
    idempotencyKey: txn.indempotency_key,
    createdAt: txn.created_at.toISOString(),
  };
}

export class TransactionController {
  private transactionService: TransactionService;
  private sagaOrchestrator: SagaOrchestrator;

  constructor() {
    this.transactionService = new TransactionService();
    this.sagaOrchestrator = new SagaOrchestrator();
  }

  async transfer(req: Request, res: Response): Promise<void> {
    try {
      const dto: TransferDTO = req.body;
      const rawFromUser = (dto as { fromUser?: unknown }).fromUser;
      const rawToUser = (dto as { toUser?: unknown }).toUser;
      const rawAmount = (dto as { amount?: unknown }).amount;

      if (rawFromUser == undefined || rawFromUser === "" || rawFromUser === null) {
        res.status(400).json({ error: "fromUser is required" });
        return;
      }

      if (rawToUser == undefined || rawToUser === "" || rawToUser === null) {
        res.status(400).json({ error: "toUser is required" });
        return;
      }

      if (rawAmount === undefined || rawAmount === "" || rawAmount === null) {
        res.status(400).json({ error: "amount is required" });
        return;
      }

      let fromUser: bigint;
      try {
        fromUser = BigInt(rawFromUser as string | number | bigint);
      } catch {
        res.status(400).json({ error: "Invalid fromUser" });
        return;
      }

      let toUser: bigint;
      try {
        toUser = BigInt(rawToUser as string | number | bigint);
      } catch {
        res.status(400).json({ error: "Invalid toUser" });
        return;
      }

      let amount: bigint;
      try {
        amount = BigInt(rawAmount as string | number | bigint);
      } catch {
        res.status(400).json({ error: "Invalid amount" });
        return;
      }

      if (amount <= 0n) {
        res.status(400).json({ error: "Amount must be positive" });
        return;
      }

      if (fromUser === toUser) {
        res.status(400).json({ error: "Cannot transfer to the same user" });
        return;
      }

      const idempotencyKey = (req as any).idempotencyKey as string;

      const transaction = await this.sagaOrchestrator.transfer(
        fromUser,
        toUser,
        amount,
        idempotencyKey,
      );

      if (!transaction) {
        res.status(500).json({ error: "Transfer failed" });
        return;
      }

      const response = toTransactionResponseDTO(transaction);
      res.status(201).json(response);
    } catch (err: any) {
      const msg = err?.message || "Internal Server Error";

      if (msg.includes("wallet not found") || msg.includes("Wallet not found")) {
        res.status(404).json({ err: msg });
        return;
      }

      if (msg.includes("Insufficient balance")) {
        res.status(400).json({ err: msg });
        return;
      }

      if (msg.includes("Transaction previously failed")) {
        res.status(409).json({ err: msg });
        return;
      }

      res.status(500).json({ err: msg });
    }
  }

  async getTransaction(req: Request, res: Response): Promise<void> {
    const parsedTxnId = tryParseBigintPathSegment(req.params.transactionId as string);
    if (!parsedTxnId.ok) {
      res.status(400).json({ error: "Invalid transactionId" });
      return;
    }

    const rawFromUser = Array.isArray(req.query.fromUser)
      ? req.query.fromUser[0]
      : req.query.fromUser;
    const parsedFromUser = tryParseBigintPathSegment(rawFromUser as string);
    if (!parsedFromUser.ok) {
      res.status(400).json({ error: "fromUser query param is required and must be a valid number" });
      return;
    }

    try {
      const transaction = await this.transactionService.getTransaction(
        parsedTxnId.value,
        parsedFromUser.value,
      );

      if (!transaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      const response = toTransactionResponseDTO(transaction);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    const parsed = tryParseBigintPathSegment(req.params.userId as string);
    if (!parsed.ok) {
      res.status(400).json({ error: "Invalid userId" });
      return;
    }

    try {
      const transactions = await this.transactionService.getHistory(
        parsed.value,
      );

      const response = transactions.map(toTransactionResponseDTO);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }
}
