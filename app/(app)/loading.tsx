import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-800",
        className,
      )}
    />
  );
}

export default function AppLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-56 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className={cn(ui.card, "overflow-hidden")}>
        <div className="border-b border-zinc-100 px-4 py-3.5 dark:border-zinc-800 sm:px-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
        <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-zinc-100 dark:lg:divide-zinc-800">
          <div className="space-y-3 p-4 sm:p-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="space-y-3 border-t border-zinc-100 p-4 dark:border-zinc-800 lg:border-t-0 sm:p-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(ui.card, ui.cardPad, "space-y-3")}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className={cn(ui.card, "space-y-3 p-4 sm:p-5")}>
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
