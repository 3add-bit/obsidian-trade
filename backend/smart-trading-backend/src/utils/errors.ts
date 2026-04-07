export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class InsufficientFundsError extends AppError {
  constructor(required: number, available: number) {
    super(
      `Insufficient funds. Required: $${required.toFixed(2)}, Available: $${available.toFixed(2)}`,
      422,
      'INSUFFICIENT_FUNDS'
    );
  }
}

export class InsufficientSharesError extends AppError {
  constructor(symbol: string, required: number, available: number) {
    super(
      `Insufficient ${symbol} shares. Required: ${required}, Available: ${available}`,
      422,
      'INSUFFICIENT_SHARES'
    );
  }
}
