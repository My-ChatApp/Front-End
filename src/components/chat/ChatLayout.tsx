import { ReactNode } from 'react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export const ChatLayout = ({ sidebar, children }: ChatLayoutProps) => {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <section className="hidden h-full w-[240px] min-w-[240px] flex-col discord-sidebar md:flex">
        {sidebar}
      </section>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-white/10 md:border-l">
        {children}
      </div>
    </div>
  );
};
