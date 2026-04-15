import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'FindTheHostel — Honest Hostel Reviews by KL University Students',
  description:
    'Find verified, honest reviews of hostels near KL University Vijayawada. Written by real students, for real students. Compare ratings, check warnings, and find your ideal hostel.',
  keywords: ['KL University', 'hostel reviews', 'Vijayawada', 'student hostels', 'KLU'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
