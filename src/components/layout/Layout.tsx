import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { SignInBanner } from '@/components/SignInBanner';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SignInBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
