import { ShardResolver } from "../../shared/database/shard-resolver.js";
import { TransactionStatus } from "../../shared/types/shared-types.js";
import { TransactionService } from "../../transaction-service/transaction.services.js";
import { CreateTransactionStep } from "../step/create-transaction-step.js";
import { CreditReceiverStep } from "../step/credit-receiver-step.js";
import { DebitSenderStep } from "../step/debit-sender-step.js";
import {
  UpdateStatusCreditStep,
  UpdateStatusDebitStep,
} from "../step/update-status-step.js";
import { SagaContext } from "../types/saga-context.js";
import { SagaStep } from "../types/saga-step.js";

export class SagaOrchestrator {
  private transactionService: TransactionService;
  private steps: SagaStep[];

  constructor() {
    this.transactionService = new TransactionService();
    this.steps = [
      new CreateTransactionStep(),
      new DebitSenderStep(),
      new UpdateStatusDebitStep(),
      new CreditReceiverStep(),
      new UpdateStatusCreditStep(),
    ];
  }

  async transfer(
    fromUser: bigint,
    toUser: bigint,
    amount: bigint,
    idempotencyKey: string,
  ) {
    if (amount <= 0) {
      throw new Error("Amount should be positive");
    }

    if (fromUser === toUser) {
      throw new Error("Cannot transfer to the same user");
    }

    const fromShardId = ShardResolver.getShardId(fromUser);
    const toShardId = ShardResolver.getShardId(toUser);

    const context: SagaContext = {
      fromUser,
      toUser,
      amount,
      idempotencyKey,
      fromShardId,
      toShardId,
    };

    const completedSteps: SagaStep[] = [];
    let currentStepIdx = -1;

    try {
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        currentStepIdx = i;

        console.log(
          `executing step ${i + 1}/${this.steps.length}:${step.getName()}`,
        );

        if (context.transaction) {
          const status = context.transaction.status;

          if (status === TransactionStatus.CREDITED) {
            return context.transaction;
          }

          if (status === TransactionStatus.FAILED) {
            throw new Error("Transaction previously failed");
          }

          if (status === TransactionStatus.PENDING) {
            throw new Error("Transaction is Pending");
          }

          if (status === TransactionStatus.DEBITED && i < 3) {
            continue;
          }

          const updatedContext = await step.execute(context);
          Object.assign(context, updatedContext);

          completedSteps.push(step);
        }
      }
    } catch (err) {
      await this.compensate(completedSteps, context);

      if (context.transaction) {
        try {
          await this.transactionService.updateTransaction(
            context.transaction.id,
            TransactionStatus.FAILED,
            context.fromUser,
          );
        } catch (updateError) {
          console.error("Failed to update transaction status", updateError);
        }
      }

      throw err;
    }
  }

  private async compensate(completedSteps: SagaStep[], context: SagaContext) {
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const step = this.steps[i];

      try {
        console.log(`Compensating step : ${step.getName()}`);
        await step.compensate(context);
      } catch (error) {
        console.error(`Failed to compensate step ${step.getName()}:`, error);

        if (step.getName() === "DebitSenderStep") {
          console.error(
            "CRITICAL : Failed to compensate debit - manual intervention required",
          );
        }
      }
    }
  }

  getSteps(): SagaStep[] {
    return this.steps;
  }
}
