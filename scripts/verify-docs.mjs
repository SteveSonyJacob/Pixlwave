import { promises as fs } from "node:fs";
import path from "node:path";

const plan = await fs.readFile("plan.md", "utf8");
const decisions = await fs.readFile(path.join("docs", "decisions.md"), "utf8");
const contracts = await fs.readFile(path.join("docs", "architecture", "P01-contracts.md"), "utf8");

for (let number = 1; number <= 18; number += 1) {
  const id = `R${String(number).padStart(2, "0")}`;
  if (!plan.includes(`| ${id} |`)) throw new Error(`Requirement ${id} is missing from plan traceability.`);
}
for (let number = 1; number <= 17; number += 1) {
  const id = `D${String(number).padStart(2, "0")}`;
  if (!decisions.includes(`| ${id} |`)) throw new Error(`Decision ${id} is missing from the register.`);
}

const requiredContracts = ["+168h", "+192h", "Payment received — awaiting admin confirmation", "Receive raw customer request queue", "Refund 95%", "Owner 85%"];
for (const phrase of requiredContracts) if (!contracts.includes(phrase)) throw new Error(`P01 contract is missing: ${phrase}`);

const appEntries = await fs.readdir(path.join("src", "app"), { recursive: true });
const forbiddenRoutes = ["pause", "resume", "extend", "dynamic-pricing", "owner-approval", "auto-refund", "route-payout"];
for (const route of forbiddenRoutes) {
  if (appEntries.some((entry) => entry.toLowerCase().split(path.sep).includes(route))) throw new Error(`Obsolete route exists: ${route}`);
}
console.log("Documentation contract checks passed: R01-R18, D01-D17, P01 policy examples, and obsolete-route absence.");
