'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import HostelCard from '@/components/HostelCard';
import PendingHostelCard from '@/components/PendingHostelCard';
import SearchFilter from '@/components/SearchFilter';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

interface HostelStats {
  hostel_id: string;
  name: string;
  location: string;
  distance_from_klu_km: number;
  status: string;
  review_count: number;
  avg_food: number;
  avg_cleanliness: number;
  avg_staff: number;
  avg_room: number;
  avg_facilities: number;
  avg_overall: number;
}

interface PendingHostel {
  id: string;
  name: string;
  location: string;
  distance_from_klu_km: number;
  created_at: string;
  confirmation_count: number;
  user_has_confirmed: boolean;
}

function HomeContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [hostels, setHostels] = useState<HostelStats[]>([]);
  const [pendingHostels, setPendingHostels] = useState<PendingHostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('top_rated');
  const [minRating, setMinRating] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [showPending, setShowPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for auth errors in URL
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    if (error && message) {
      const decoded = decodeURIComponent(message);
      // Replace technical errors with user-friendly messages
      if (decoded.includes('PKCE') || decoded.includes('code verifier')) {
        setAuthError('Please open the sign-in link in the same browser where you entered your email. Try signing in again from this browser.');
      } else if (decoded.includes('expired') || decoded.includes('invalid')) {
        setAuthError('Your sign-in link has expired. Please request a new one.');
      } else {
        setAuthError(decoded);
      }
    }
  }, [searchParams]);

  const fetchHostels = async () => {
    const { data, error } = await supabase
      .from('hostel_stats')
      .select('*')
      .eq('status', 'approved');

    if (!error && data) {
      setHostels(data);
    }
    setLoading(false);
  };

  const fetchPendingHostels = async () => {
    if (!user) return;

    const { data: pendingData } = await supabase
      .from('hostels')
      .select('id, name, location, distance_from_klu_km, created_at')
      .eq('status', 'pending');

    if (pendingData) {
      const enriched = await Promise.all(
        pendingData.map(async (h: any) => {
          const { count } = await supabase
            .from('hostel_confirmations')
            .select('*', { count: 'exact', head: true })
            .eq('hostel_id', h.id);

          const { data: userConfirm } = await supabase
            .from('hostel_confirmations')
            .select('id')
            .eq('hostel_id', h.id)
            .eq('user_id', user.id)
            .maybeSingle();

          return {
            ...h,
            confirmation_count: count || 0,
            user_has_confirmed: !!userConfirm,
          };
        })
      );
      setPendingHostels(enriched);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPendingHostels();
    }
  }, [user]);

  // Filter and sort hostels
  const filteredHostels = useMemo(() => {
    let result = [...hostels];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((h: any) =>
        h.name.toLowerCase().includes(query)
      );
    }

    // Min rating filter
    if (minRating) {
      const min = parseFloat(minRating);
      result = result.filter((h: any) => h.avg_overall >= min);
    }

    // Max distance filter
    if (maxDistance) {
      const max = parseFloat(maxDistance);
      result = result.filter((h: any) => h.distance_from_klu_km <= max);
    }

    // Sort
    switch (sortBy) {
      case 'top_rated':
        result.sort((a, b) => b.avg_overall - a.avg_overall);
        break;
      case 'most_reviewed':
        result.sort((a, b) => b.review_count - a.review_count);
        break;
      case 'nearest':
        result.sort((a, b) => a.distance_from_klu_km - b.distance_from_klu_km);
        break;
    }

    return result;
  }, [hostels, searchQuery, sortBy, minRating, maxDistance]);

  return (
    <div className="page-container">
      {/* Auth Error Banner */}
      {authError && (
        <div className="auth-error-banner" id="auth-error-banner">
          <span>🔒</span>
          <span>{authError}</span>
          <button onClick={() => setAuthError(null)}>✕</button>
        </div>
      )}

      {/* Hero Section */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 className="page-title">Find Your Ideal Hostel Near Campus</h1>
        <p className="page-subtitle">
          Honest, verified reviews from real KL University students. No ads, no noise — just truth.
        </p>
      </div>

      {/* Search & Filters */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          maxDistance={maxDistance}
          onMaxDistanceChange={setMaxDistance}
        />
      </div>

      {/* Hostel Grid */}
      {loading ? (
        <div className="hostel-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" style={{ minHeight: 200 }}>
              <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 20, width: '30%' }} />
            </div>
          ))}
        </div>
      ) : filteredHostels.length > 0 ? (
        <div className="hostel-grid" id="hostel-grid">
          {filteredHostels.map((hostel) => (
            <HostelCard key={hostel.hostel_id} hostel={hostel} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🏘️"
          title="No hostels found"
          description="No results match your search. Know a hostel? Add it for the community."
          action={
            user ? (
              <Link href="/add-hostel" className="btn btn-primary">
                Add a Hostel
              </Link>
            ) : undefined
          }
        />
      )}

      {/* Pending Hostels Section */}
      {user && pendingHostels.length > 0 && (
        <div style={{ marginTop: 'var(--space-12)' }}>
          <div className="section-header">
            <h2 className="section-title" id="pending-section-title">
              Pending Hostels ({pendingHostels.length})
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPending(!showPending)}
            >
              {showPending ? 'Hide' : 'Show'}
            </button>
          </div>

          {showPending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {pendingHostels.map((hostel) => (
                <PendingHostelCard
                  key={hostel.id}
                  hostel={hostel}
                  confirmationCount={hostel.confirmation_count}
                  userHasConfirmed={hostel.user_has_confirmed}
                  onConfirm={() => {
                    fetchPendingHostels();
                    fetchHostels();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="page-container page-loading">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
