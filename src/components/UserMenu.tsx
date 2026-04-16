'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = profile?.display_name || 'KL Student';
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="user-menu-container" ref={ref}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        id="user-menu-button"
      >
        <div className="user-avatar">{initials}</div>
        <span className="user-menu-name">{displayName}</span>
        <svg className="user-menu-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="user-menu-dropdown" id="user-menu-dropdown">
          <button className="user-menu-item" onClick={() => { setOpen(false); router.push('/profile'); }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            My Profile
          </button>
          <button className="user-menu-item" onClick={() => { setOpen(false); router.push('/profile?tab=reviews'); }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l2.2 4.4 4.8.7-3.5 3.4.8 4.8L8 12l-4.3 2.3.8-4.8-3.5-3.4 4.8-.7L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            My Reviews
          </button>
          <button className="user-menu-item" onClick={() => { setOpen(false); router.push('/profile?tab=pending'); }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Pending Hostels
          </button>
          <div className="user-menu-divider" />
          <button className="user-menu-item danger" onClick={() => { signOut(); setOpen(false); }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
