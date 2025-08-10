import { BitcraftService } from "@src/bitcraft/BitcraftService";
import { CommandBase } from "@src/framework";

export default class InitialiseBitcraftServiceCommand extends CommandBase<
  object,
  void
> {
  async execute() {
    await BitcraftService.start();
    await BitcraftService.instance.createBaseSubscriptions();
  }
}
