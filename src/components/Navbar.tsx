'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthButton from './AuthButton';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <div className="navbar-brand-icon">KL</div>
          <span>FindTheHostel</span>
        </Link>

        <div className="navbar-actions">
          {user && (
            <Link href="/add-hostel" className="btn btn-primary btn-sm" id="add-hostel-nav-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add Hostel
            </Link>
          )}
          <AuthButton />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
