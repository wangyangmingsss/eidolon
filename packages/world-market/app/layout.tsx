import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'The Echo Market — Eidolon',
  description: 'Where Souls drift to be reborn.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
