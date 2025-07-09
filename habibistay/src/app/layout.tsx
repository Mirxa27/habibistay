import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HabibiStay - Modern Vacation Rental Platform',
  description: 'Find your perfect accommodation with HabibiStay. Discover unique properties and experiences around the world.',
  keywords: 'vacation rental, accommodation, travel, booking, properties',
  authors: [{ name: 'HabibiStay Team' }],
  creator: 'HabibiStay',
  publisher: 'HabibiStay',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
