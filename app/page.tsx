import { redirect } from "next/navigation";

/**
 * Root is gated by the proxy. Authenticated users land here and go to the app;
 * unauthenticated users never reach this page (proxy → /login).
 */
export default function HomePage() {
  redirect("/dashboard");
}
