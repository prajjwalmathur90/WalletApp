import { Request, Response } from "express";
import { WalletService } from "./wallet-services.js";
import {
  AddMoneyDTO,
  CreateWalletDTO,
  WalletResponseDTO,
} from "../shared/dtos/wallet.dto.js";

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

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  async createWallet(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateWalletDTO = req.body;
      const rawUserId = (dto as { userId?: unknown }).userId;

      if (rawUserId == undefined || rawUserId === "" || rawUserId === null) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      let userId: bigint;
      try {
        userId = BigInt(rawUserId as string | number | bigint);
      } catch (err) {
        res.status(400).json({ error: "Invalid userId" });
        return;
      }

      const wallet = await this.walletService.createWallet(userId);

      const response: WalletResponseDTO = {
        id: wallet.id.toString(),
        userId: wallet.user_id.toString(),
        balance: wallet.balance.toString(),
        version: wallet.version,
        createdAt: wallet.created_at.toISOString(),
        updatedAt: wallet.updated_at.toISOString(),
      };

      res.status(201).json(response);
    } catch (err: any) {
      const msg = err?.message || "Internal Server Error";

      if (msg.includes("already exists")) {
        res.status(409).json({ err: msg });
        return;
      }

      res.status(500).json({ err: msg });
    }
  }

  async getWallet(req: Request, res: Response): Promise<void> {
    const parsed = tryParseBigintPathSegment(req.params.userId as string);

    if (!parsed.ok) {
      res.status(400).json({ error: "Invalid userId" });
      return;
    }

    try {
      const wallet = await this.walletService.getWallet(parsed.value);
      if (!wallet) {
        res.status(404).json({ error: "Wallet not found" });
        return;
      }

      const response: WalletResponseDTO = {
        id: wallet.id.toString(),
        userId: wallet.user_id.toString(),
        balance: wallet.balance.toString(),
        version: wallet.version,
        createdAt: wallet.created_at.toISOString(),
        updatedAt: wallet.updated_at.toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }

  async addMoney(req: Request, res: Response): Promise<void> {
    const parsed = tryParseBigintPathSegment(req.params.userId as string);

    if (!parsed.ok) {
      res.status(400).json({ error: "Invalid userId" });
      return;
    }

    try {
      const dto: AddMoneyDTO = req.body;
      const rawAmount = (dto as { amount?: unknown }).amount;

      if (rawAmount === undefined || rawAmount === "" || rawAmount === null) {
        res.status(400).json({ error: "Amount is required" });
        return;
      }

      let amount: bigint;
      try {
        amount = BigInt(rawAmount as string | number | bigint);
      } catch (err) {
        res.status(400).json({ error: "Invalid amount" });
        return;
      }

      if (amount <= 0n) {
        res.status(400).json({ error: "Amount must be positive" });
        return;
      }

      const wallet = await this.walletService.addMoney(parsed.value, amount);

      const response: WalletResponseDTO = {
        id: wallet.id.toString(),
        userId: wallet.user_id.toString(),
        balance: wallet.balance.toString(),
        version: wallet.version,
        createdAt: wallet.created_at.toISOString(),
        updatedAt: wallet.updated_at.toISOString(),
      };

      res.status(200).json(response);
    } catch (err: any) {
      const msg = err?.message || "Internal Server Error";

      if (msg.includes("wallet not found")) {
        res.status(404).json({ err: msg });
        return;
      }

      res.status(500).json({ err: msg });
    }
  }
}
