import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'The Crooked Lantern — Eidolon',
  description: 'A tavern where Souls are forged.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
