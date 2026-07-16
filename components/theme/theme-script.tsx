import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Inline script to apply saved theme before paint (avoids light→dark flash).
 * Default remains light when nothing is stored.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark")document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
