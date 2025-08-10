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
    // convert this.args to json without quotes around keys
    const args = Object.entries(this.args)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(", ");

    return `${this.constructor.name} { ${args} }`;
  }
}
