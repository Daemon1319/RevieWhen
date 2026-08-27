import { AppNav } from "@/components/layout/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 pb-28 md:px-6 md:py-10 md:pb-12">
        {children}
      </main>
    </>
  );
}
