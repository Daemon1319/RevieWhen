import { redirect } from "next/navigation";

/** Old route — keep so bookmarks still work. */
export default function ErrorsRedirectPage() {
  redirect("/reviews");
}
