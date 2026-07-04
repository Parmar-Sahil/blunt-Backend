export class AppError extends Error {
  public readonly success: boolean = false;
  
  constructor(
    public readonly message: string,
    public readonly statusCode: number
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "BAD REQUEST") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "UNAUTHORIZED ACCESS") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "ACCESS FORBIDDEN") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "RESOURCE NOT FOUND") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  public errors: any[];
  constructor(message: string = "VALIDATION FAILED", errors: any[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "RESOURCE CONFLICT OCCURRED") {
    super(message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "DATABASE OPERATION ERROR") {
    super(message, 500);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "INTERNAL SERVER ERROR") {
    super(message, 500);
  }
}

