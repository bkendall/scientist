import { Experiment, Result } from "../src/index.js";

class MyExperiment<V> extends Experiment<V> {
  constructor(name: string) {
    super(name);
  }

  /**
   * Publisher function. Takes a result, must return a Promise.
   * @param {Result} result Result object from Scientist.
   * @return {Promise} Promise resolved when publishing is done.
   */
  async publish(result: Result<V>) {
    const control = result.observations.find((o) => o.name === "control");
    const candidate = result.observations.find((o) => o.name === "candidate");
    if (!control) {
      console.error("Could not find control.");
      return false;
    }
    if (!candidate) {
      console.error("Could not find candidate.");
      return false;
    }
    console.log("Results:");
    console.log(
      "Correctness (were the candidates correct?):",
      !result.mismatched() ? "yes" : "no",
    );
    console.log("Values (control, candidate):", control.value, candidate.value);
    console.log("Candidate Time:", candidate.duration);
    console.log("Control Time:", control.duration);
    console.log(
      "Improvement Time (+larger is better):",
      (control.duration || 0) - (candidate.duration || 0),
    );
    return Promise.resolve(true);
  }
}

async function main() {
  // as the first case, with just an Experiment:
  const experiment = new MyExperiment<boolean>("foobar");

  experiment.use(async () => {
    return await Promise.resolve(true);
  });
  // try: the candidate. value will be reported in `.publish`.
  experiment.try(
    async () =>
      await new Promise((resolve) => setTimeout(() => resolve(true), 10)),
  );
  // run: run the experiment.
  await experiment.run();
}

void main();
