import { redirect } from "next/navigation";

export const dynamic = "force-static";

/** The index lives at `/`. Keep this path from falling through to a Worker error. */
export default function ContestsIndexPage() {
  redirect("/");
}
