import { Experiment } from "./experiment.js";

export class Scientist {
  science(
    name: string,
    opts: { Experiment?: typeof Experiment } = {},
  ): Experiment<unknown> {
    const Type = opts.Experiment || Experiment;
    const experiment = new Type(name);
    experiment.context({});
    return experiment;
  }
}
