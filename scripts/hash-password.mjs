import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { hashPassword } from "../src/lib/password.ts";

const reader = createInterface({ input, output });
const password = await reader.question("Password (not stored in this script): ");
reader.close();
const problem = password.length < 12 ? "Use at least 12 characters." : "";
if (problem) {
  console.error(problem);
  process.exitCode = 1;
} else {
  const hash = await hashPassword(password);
  output.write(`${hash}\n`);
}
