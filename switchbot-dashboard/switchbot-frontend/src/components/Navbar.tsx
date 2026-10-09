import { ConnectionBadge } from './ConnectionBadge';
import type { ConnectionState } from './ConnectionBadge';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Navbar({ connection }: { connection: ConnectionState }) {
  return (
    <header className="sticky top-0 z-20 border-b-theme border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <a href="/" className="text-lg font-bold tracking-tight text-fg">
            Temp Master Dashboard
          </a>
          <nav>
            <a href="/" aria-current="page" className="rounded-md bg-surface-muted px-3 py-1.5 text-sm font-medium text-fg">
              Dashboard
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <ConnectionBadge state={connection} />
        </div>
      </div>
    </header>
  );
}
