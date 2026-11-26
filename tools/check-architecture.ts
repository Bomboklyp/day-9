import { resolve, dirname } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { analyzeProject } from "./architecture";

const argument = (name: string) =>
  process.argv
    .find((value) => value.startsWith(name + "="))
    ?.slice(name.length + 1);
const result = await analyzeProject(resolve(argument("--root") ?? "."));
const report = argument("--report");
if (report) {
  await mkdir(dirname(report), { recursive: true });
  await writeFile(report, JSON.stringify(result, null, 2) + "\n");
}
for (const violation of result.violations) console.error(violation);
for (const cycle of result.cycles)
  console.error("Cycle: " + cycle.join(" -> "));
console.log(
  `${result.files} files, ${result.edges.length} dependencies, ${result.violations.length} boundary violations, ${result.cycles.length} cycles`,
);
if (result.violations.length || result.cycles.length) process.exitCode = 1;
