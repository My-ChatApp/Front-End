export const SidebarSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-2 px-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-1 py-1">
          <div className="chat-skeleton size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="chat-skeleton h-3 w-3/4 rounded" />
            <div className="chat-skeleton h-2 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
