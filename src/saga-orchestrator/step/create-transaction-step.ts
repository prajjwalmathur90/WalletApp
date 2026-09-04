import { TransactionService } from "../../transaction-service/transaction.services.js";
import { SagaContext } from "../types/saga-context.js";
import { SagaStep } from "../types/saga-step.js";

export class CreateTransactionStep implements SagaStep {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    const existing =
      await this.transactionService.getTransactionByIdempotencyKey(
        context.idempotencyKey,
        context.fromUser,
      );

    if (existing) {
      context.transaction = existing;
      return context;
    }

    const transaction = await this.transactionService.createTransaction(
      context.fromUser,
      context.toUser,
      context.amount,
      context.idempotencyKey,
    );

    context.transaction = transaction;
    return context;
  }

  compensate(_context: SagaContext): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getName(): string {
    return "CreateTransactionStep";
  }
}
