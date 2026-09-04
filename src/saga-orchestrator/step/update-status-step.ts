import { TransactionStatus } from "../../shared/types/shared-types.js";
import { TransactionService } from "../../transaction-service/transaction.services.js";
import { SagaContext } from "../types/saga-context.js";
import { SagaStep } from "../types/saga-step.js";

export class UpdateStatusDebitStep implements SagaStep {
  transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  getName(): string {
    return "UpdateStatusDebitStep";
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    if (!context.transaction) {
      throw new Error("Transaction not found");
    }

    const updatedTransaction = await this.transactionService.updateTransaction(
      context.transaction.id,
      TransactionStatus.DEBITED,
      context.fromUser,
    );

    context.transaction = updatedTransaction;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    if (!context.transaction) {
      return;
    }

    try {
      await this.transactionService.updateTransaction(
        context.transaction.id,
        TransactionStatus.PENDING,
        context.fromUser,
      );
    } catch (error) {
      console.error("Failed to update transaction status", error);
    }
  }
}

export class UpdateStatusCreditStep implements SagaStep {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  getName(): string {
    return "UpdateStatusCreditStep";
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    if (!context.transaction) {
      throw new Error("Transaction not found");
    }

    const updatedTransaction = await this.transactionService.updateTransaction(
      context.transaction.id,
      TransactionStatus.CREDITED,
      context.fromUser,
    );

    context.transaction = updatedTransaction;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    if (!context.transaction) {
      return;
    }

    try {
      await this.transactionService.updateTransaction(
        context.transaction.id,
        TransactionStatus.DEBITED,
        context.fromUser,
      );
    } catch (error) {
      console.error("Failed to update transaction status", error);
    }
  }
}
