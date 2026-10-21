import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const origin = process.env.APP_URL;
if (!origin)
  throw new Error(
    "Set APP_URL to the actual returned public deployment origin.",
  );
const sha = (value) => createHash("sha256").update(value).digest("hex");
const response = await fetch(origin, { redirect: "follow" });
if (
  response.status !== 200 ||
  new URL(response.url).origin !== new URL(origin).origin
) {
  throw new Error(
    `Anonymous origin check failed: ${response.status} ${response.url}`,
  );
}
const html = await response.text();
if (!html.includes("Harrisons Enhanced"))
  throw new Error("The public HTML does not identify Enhanced.");
const paths = [
  ...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g),
].map((match) => match[1]);
if (
  !paths.some((path) => path.endsWith(".js")) ||
  !paths.some((path) => path.endsWith(".css"))
) {
  throw new Error("Expected JS and CSS entry assets were not found.");
}
const assets = [];
for (const path of paths) {
  const served = await fetch(new URL(path, origin));
  if (!served.ok) throw new Error(`Asset request failed: ${path}`);
  const remote = Buffer.from(await served.arrayBuffer());
  const local = await readFile(resolve("dist", path.slice(1)));
  if (sha(remote) !== sha(local))
    throw new Error(`Asset differs from tested build: ${path}`);
  assets.push({ path, sha256: sha(local), bytes: local.length });
}
const proof = {
  origin,
  anonymousStatus: response.status,
  checkedAt: new Date().toISOString(),
  assets,
};
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/deployment-proof.json",
  JSON.stringify(proof, null, 2) + "\n",
);
console.log(JSON.stringify(proof, null, 2));
