import { Request, Response, NextFunction } from "express";
import { IdempotencyUtil } from "../utils/idempotency.js";

export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const idempotencyKey =
    (req.headers["x-idempotency-key"] as string) || req.body?.idempotencyKey;

  if (!idempotencyKey) {
    const newKey = IdempotencyUtil.generateKey();
    req.headers["x-idemptency-key"] = newKey;
    if (req.body) {
      req.body.idempotencyKey = newKey;
    }
  } else if (!IdempotencyUtil.isValidKey(idempotencyKey)) {
    res.status(400).json({
      error: "Invalid Idempotency key format, must be a valid uuid v4 format",
    });
  }

  (req as any).idempotencyKey =
    req.headers["x-idempotency-key"] || req.body?.idempotencyKey;

  next();
}
