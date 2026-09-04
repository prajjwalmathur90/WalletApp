import { SagaContext } from "./saga-context.js";

export interface SagaStep {
  execute(context: SagaContext): Promise<SagaContext>;

  compensate(context: SagaContext): Promise<void>;

  getName(): string;
}
