import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * M0 is Git-as-CMS SSG: contest YAML is read at build time.
 * The default dummy cache is enough; do not require an R2 bucket.
 */
export default defineCloudflareConfig();
