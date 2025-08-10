import { CommandBase } from "@src/framework";

interface CreateProjectCommandArgs {
  projectName: string;
}

export default class CreateProjectCommand extends CommandBase<
  CreateProjectCommandArgs,
  string
> {
  async execute(): Promise<string> {
    console.log(`Creating project: ${this.args.projectName}`);
    // Here you would add the logic to create a new project
    // For example, initializing a new git repository, creating directories, etc.
    return "";
  }
}
