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
    default: 'Patient intake',
    template: '%s | Patient intake',
  },
  description: 'A patient registration form that staff can watch in real time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${plexThaiLooped.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}