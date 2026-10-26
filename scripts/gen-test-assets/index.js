#!/usr/bin/env node
// Generates the synthetic glTF 2.1 test assets.
//
// Output goes to public/test-assets/ so the dev server and Playwright can fetch it.
// That directory is generated, not committed; index.json records sizes and hashes so a
// change in generator output is visible in review.

import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ASSETS } from "./manifest.js";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "..", "..", "public", "test-assets");
const indexPath = join(here, "index.json");

async function main() {
    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    const index = {};
    for (const [name, build] of Object.entries(ASSETS)) {
        const bytes = new Uint8Array(build());
        await writeFile(join(outputDir, name), bytes);
        index[name] = {
            bytes: bytes.length,
            sha256: createHash("sha256").update(bytes).digest("hex").slice(0, 16)
        };
        console.log(`${name.padEnd(36)} ${String(bytes.length).padStart(7)} bytes`);
    }

    await writeFile(indexPath, JSON.stringify(index, null, 4) + "\n");
    console.log(`\n${Object.keys(index).length} assets written to public/test-assets/`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
