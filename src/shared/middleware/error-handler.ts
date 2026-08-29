import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log("Error : ", err);
  let statusCode = 500;
  const errorAny = err as Error & { status?: number; statusCode?: number };

  if (
    err instanceof SyntaxError &&
    (errorAny.status == 400 ||
      errorAny.statusCode === 400 ||
      /json/i.test(err.message))
  ) {
    statusCode = 400;
  } else if (err.message.includes("not found")) {
    statusCode = 404;
  } else if (
    err.message.includes("Insufficient") ||
    err.message.includes("balance")
  ) {
    statusCode = 400;
  } else if (err.message.includes("already exits")) {
    statusCode = 409;
  } else if (err.message.includes("Invalid")) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
  });
}
