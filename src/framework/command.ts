export interface ICommand<TResult> {
  execute(): Promise<TResult>;
}

export abstract class CommandBase<
  TArgs extends object,
  TResult,
> extends Object {
  constructor(readonly args: TArgs) {
    super();
  }

  abstract execute(): Promise<TResult> | TResult;

  override toString(): string {
    return this.constructor.name;
  }
}
