export const MessageSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`chat-skeleton h-14 rounded-2xl ${
              i % 2 === 0 ? 'w-[60%]' : 'w-[45%]'
            }`}
          />
        </div>
      ))}
    </div>
  );
};
