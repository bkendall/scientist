import ExperimentPkg from "./experiment";

class Scientist {
  static Experiment: typeof ExperimentPkg;

  science(
    name: string,
    opts: { Experiment?: typeof ExperimentPkg } = {}
  ): ExperimentPkg<unknown> {
    const Type = opts.Experiment || ExperimentPkg;
    const experiment = new Type(name);
    experiment.context({});
    return experiment;
  }
}

Scientist.Experiment = ExperimentPkg;

export default Scientist;
