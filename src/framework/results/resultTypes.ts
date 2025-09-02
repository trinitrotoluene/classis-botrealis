export class SuccessResult<T> {
  readonly ok = true;

  constructor(public data: T) {}
}

export abstract class ErrorResult {
  readonly ok = false;
  abstract readonly type: string;
  constructor(public message: string) {}
}

export class ValidationError extends ErrorResult {
  readonly type = "validation_error";
  constructor(
    message: string,
    public fieldErrors: Array<{ path: string; message: string }>,
  ) {
    super(message);
  }
}

export class NotFoundError extends ErrorResult {
  readonly type = "not_found";
  constructor(
    message: string,
    public entityId?: string,
  ) {
    super(message);
  }
}

export class GenericError extends ErrorResult {
  readonly type = "generic_error";
}

export type TResult<T> =
  | SuccessResult<T>
  | ValidationError
  | NotFoundError
  | GenericError;
