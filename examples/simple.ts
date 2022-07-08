import { Experiment } from "../src";

const experiment = new Experiment<boolean>("getData");
// use: the control. value will be returned by `.run`.
experiment.use(async () => {
  return await Promise.resolve(true);
});
// try: the candidate. value will be reported in `.publish`.
experiment.try(async () => {
  return await new Promise((resolve) => setTimeout(() => resolve(true), 10));
});
// run: run the experiment.
experiment.run().then((result) => {
  // result === true, from `.use`.
  console.log(result);
});
