import { IBM_Plex_Sans_Thai_Looped } from 'next/font/google';
import './globals.css';

// Looped Thai letters are easier to tell apart, which matters for older patients.
// The same family includes Latin letters, so Thai and English share one look.
const plexThaiLooped = IBM_Plex_Sans_Thai_Looped({
  subsets: ['thai', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-plex-thai-looped',
});

export const metadata = {
  title: {
    default: 'OPD Check-in',
    template: '%s | OPD Check-in',
  },
  description:
    'Outpatient check-in: patients fill in a form on their own device while staff watch each answer arrive live.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${plexThaiLooped.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}