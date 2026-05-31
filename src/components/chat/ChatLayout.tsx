import { ReactNode } from 'react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export const ChatLayout = ({ sidebar, children }: ChatLayoutProps) => {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden p-2 md:p-4">
      <section className="hidden h-full w-[300px] min-w-[300px] flex-col overflow-hidden rounded-[1.75rem] border border-[var(--discord-border)] bg-[var(--discord-sidebar)] shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:flex">
        {sidebar}
      </section>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-[var(--discord-border)] bg-[var(--discord-panel)] shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:ml-4">
        {children}
      </div>
    </div>
  );
};
