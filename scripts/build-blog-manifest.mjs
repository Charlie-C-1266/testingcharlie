// Generate src/posts.generated.ts from the Markdown in content/blog/.
//
// This MUST run before `tsc`, because src/config.ts imports the generated
// module so the homepage "Writing" section is typed and rendered at compile
// time. See the `build:site` npm script for the ordering.

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPosts, renderPostsManifest } from "./blog.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const target = join(root, "src", "posts.generated.ts");

const posts = await loadPosts();
await writeFile(target, renderPostsManifest(posts));
console.log(`Wrote posts manifest (${posts.length} post${posts.length === 1 ? "" : "s"}) → src/posts.generated.ts`);
