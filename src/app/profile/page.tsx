'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import StarRating from '@/components/StarRating';
import PendingHostelCard from '@/components/PendingHostelCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';

interface UserReview {
  id: string;
  hostel_id: string;
  text: string;
  food_rating: number;
  cleanliness_rating: number;
  staff_rating: number;
  room_rating: number;
  facilities_rating: number;
  recommend: boolean;
  created_at: string;
  hostel_name: string;
}

interface VotedReview {
  review_id: string;
  review_text: string;
  hostel_name: string;
  hostel_id: string;
  author_name: string;
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

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const supabase = createClient();

  const initialTab = searchParams.get('tab') || 'reviews';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [myReviews, setMyReviews] = useState<UserReview[]>([]);
  const [myVotes, setMyVotes] = useState<VotedReview[]>([]);
  const [pendingHostels, setPendingHostels] = useState<PendingHostel[]>([]);
  const [totalUpvotes, setTotalUpvotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewDeleteId, setReviewDeleteId] = useState<string | null>(null);

  const fetchMyReviews = useCallback(async () => {
    if (!user) return;

    // Fetch reviews with hostel names via a join-like approach
    const { data } = await supabase
      .from('reviews')
      .select('id, hostel_id, text, food_rating, cleanliness_rating, staff_rating, room_rating, facilities_rating, recommend, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      // Batch fetch hostel names
      const hostelIds = [...new Set(data.map((r: any) => r.hostel_id))];
      const { data: hostels } = await supabase
        .from('hostels')
        .select('id, name')
        .in('id', hostelIds);

      const hostelMap = new Map(hostels?.map((h: any) => [h.id, h.name]) || []);

      const enriched = data.map((review: any) => ({
        ...review,
        hostel_name: hostelMap.get(review.hostel_id) || 'Unknown Hostel',
      }));
      setMyReviews(enriched);

      // Batch count upvotes
      const reviewIds = data.map((r: any) => r.id);
      const { data: upvotes } = await supabase
        .from('review_votes')
        .select('review_id')
        .in('review_id', reviewIds)
        .eq('vote_type', 'upvote');

      setTotalUpvotes(upvotes?.length || 0);
    } else {
      setMyReviews([]);
      setTotalUpvotes(0);
    }
  }, [user, supabase]);

  const fetchMyVotes = useCallback(async () => {
    if (!user) return;

    const { data: votes } = await supabase
      .from('review_votes')
      .select('review_id')
      .eq('user_id', user.id)
      .eq('vote_type', 'upvote');

    if (votes && votes.length > 0) {
      const reviewIds = votes.map((v: any) => v.review_id);

      // Batch fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, text, hostel_id, user_id')
        .in('id', reviewIds);

      if (reviewsData && reviewsData.length > 0) {
        // Batch fetch hostels
        const hostelIds = [...new Set(reviewsData.map((r: any) => r.hostel_id))];
        const { data: hostels } = await supabase
          .from('hostels')
          .select('id, name')
          .in('id', hostelIds);
        const hostelMap = new Map(hostels?.map((h: any) => [h.id, h.name]) || []);

        // Batch fetch authors
        const authorIds = [...new Set(reviewsData.map((r: any) => r.user_id))];
        const { data: authors } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', authorIds);
        const authorMap = new Map(authors?.map((a: any) => [a.id, a.display_name]) || []);

        const enriched = reviewsData.map((review: any) => ({
          review_id: review.id,
          review_text: review.text,
          hostel_name: hostelMap.get(review.hostel_id) || 'Unknown',
          hostel_id: review.hostel_id,
          author_name: authorMap.get(review.user_id) || 'Anonymous',
        }));
        setMyVotes(enriched);
      } else {
        setMyVotes([]);
      }
    } else {
      setMyVotes([]);
    }
  }, [user, supabase]);

  const fetchPendingHostels = useCallback(async () => {
    if (!user) return;

    const { data: pendingData } = await supabase
      .from('hostels')
      .select('id, name, location, distance_from_klu_km, created_at')
      .eq('status', 'pending');

    if (pendingData && pendingData.length > 0) {
      const hostelIds = pendingData.map((h: any) => h.id);

      // Batch fetch confirmations
      const { data: allConfirmations } = await supabase
        .from('hostel_confirmations')
        .select('hostel_id, user_id')
        .in('hostel_id', hostelIds);

      const enriched = pendingData.map((h: any) => {
        const confirmations = allConfirmations?.filter((c: any) => c.hostel_id === h.id) || [];
        return {
          ...h,
          confirmation_count: confirmations.length,
          user_has_confirmed: confirmations.some((c: any) => c.user_id === user.id),
        };
      });
      setPendingHostels(enriched);
    } else {
      setPendingHostels([]);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchMyReviews(), fetchMyVotes(), fetchPendingHostels()]);
      setLoading(false);
    };
    loadAll();
  }, [user, fetchMyReviews, fetchMyVotes, fetchPendingHostels]);

  const handleUpdateName = async () => {
    if (!user || !newDisplayName.trim()) return;

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newDisplayName.trim() })
      .eq('id', user.id);

    if (error) {
      addToast('Failed to update name', 'error');
    } else {
      addToast('Display name updated!', 'success');
      setEditingName(false);
      refreshProfile();
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewDeleteId) return;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewDeleteId);

    if (error) {
      addToast('Failed to delete review', 'error');
    } else {
      addToast('Review deleted', 'success');
      fetchMyReviews();
    }
    setReviewDeleteId(null);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    // Anonymize reviews (update user_id display name)
    await supabase
      .from('profiles')
      .update({ display_name: 'Deleted User' })
      .eq('id', user.id);

    // Sign out
    await signOut();
    addToast('Account deleted. Your reviews have been anonymized.', 'info');
    setDeleteConfirmOpen(false);
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="page-container page-loading">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="page-container">
        <EmptyState
          icon="🔒"
          title="Sign in Required"
          description="Please sign in with your @kluniversity.in email to view your profile."
        />
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
  });

  const initials = profile.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-container">
      {/* Profile Header */}
      <div className="profile-header" id="profile-header">
        <div className="profile-avatar-large">{initials}</div>
        <div className="profile-info">
          <div className="profile-name">
            {editingName ? (
              <div className="inline-edit">
                <input
                  className="inline-edit-input"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={handleUpdateName}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>Cancel</button>
              </div>
            ) : (
              <>
                {profile.display_name}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setNewDisplayName(profile.display_name);
                    setEditingName(true);
                  }}
                >
                  ✏️
                </button>
              </>
            )}
          </div>
          <div className="profile-joined">Member since {memberSince}</div>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{myReviews.length}</span>
              <span className="profile-stat-label">Reviews</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{totalUpvotes}</span>
              <span className="profile-stat-label">Upvotes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          My Reviews
        </button>
        <button
          className={`profile-tab ${activeTab === 'votes' ? 'active' : ''}`}
          onClick={() => setActiveTab('votes')}
        >
          My Votes
        </button>
        <button
          className={`profile-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Hostels
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <>
          {/* My Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {myReviews.length > 0 ? (
                myReviews.map((review) => {
                  const avg = (review.food_rating + review.cleanliness_rating + review.staff_rating + review.room_rating + review.facilities_rating) / 5;
                  const date = new Date(review.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <div key={review.id} className="profile-review-item">
                      <div className="profile-review-info">
                        <Link href={`/hostel/${review.hostel_id}`} className="profile-review-hostel">
                          {review.hostel_name}
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                          <StarRating rating={avg} size="sm" />
                          <span className={`review-card-recommend ${review.recommend ? 'yes' : 'no'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                            {review.recommend ? '👍' : '👎'}
                          </span>
                        </div>
                        <p className="profile-review-excerpt">{review.text}</p>
                        <span className="profile-review-date">{date}</span>
                      </div>
                      <div className="profile-review-actions">
                        <Link
                          href={`/hostel/${review.hostel_id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => setReviewDeleteId(review.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon="📝"
                  title="No reviews yet"
                  description="You haven't reviewed any hostels yet. Find a hostel and share your experience!"
                  action={
                    <Link href="/" className="btn btn-primary">
                      Browse Hostels
                    </Link>
                  }
                />
              )}
            </div>
          )}

          {/* My Votes Tab */}
          {activeTab === 'votes' && (
            <div>
              {myVotes.length > 0 ? (
                myVotes.map((vote) => (
                  <div key={vote.review_id} className="profile-review-item">
                    <div className="profile-review-info">
                      <Link href={`/hostel/${vote.hostel_id}`} className="profile-review-hostel">
                        {vote.hostel_name}
                      </Link>
                      <p className="profile-review-excerpt">
                        <em>Review by {vote.author_name}:</em> {vote.review_text}
                      </p>
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)' }}>
                      👍 Upvoted
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="👍"
                  title="No upvoted reviews"
                  description="You haven't upvoted any reviews yet."
                />
              )}
            </div>
          )}

          {/* Pending Confirmations Tab */}
          {activeTab === 'pending' && (
            <div>
              {pendingHostels.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {pendingHostels.map((hostel) => (
                    <PendingHostelCard
                      key={hostel.id}
                      hostel={hostel}
                      confirmationCount={hostel.confirmation_count}
                      userHasConfirmed={hostel.user_has_confirmed}
                      onConfirm={fetchPendingHostels}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="⏳"
                  title="No pending hostels"
                  description="There are no hostels waiting for confirmation right now."
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Account Section */}
      <div className="danger-zone" id="danger-zone">
        <h3 className="danger-zone-title">Danger Zone</h3>
        <p className="danger-zone-description">
          Deleting your account will anonymize all your reviews (they won&apos;t be deleted to preserve community value)
          and sign you out permanently.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={signOut}>
            Sign Out
          </button>
          <button className="btn btn-danger" onClick={() => setDeleteConfirmOpen(true)}>
            Delete My Account
          </button>
        </div>
      </div>

      {/* Delete Review Confirm */}
      <ConfirmDialog
        open={!!reviewDeleteId}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        danger
        onConfirm={handleDeleteReview}
        onCancel={() => setReviewDeleteId(null)}
      />

      {/* Delete Account Confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Account"
        message="This will anonymize all your reviews and permanently sign you out. Are you absolutely sure?"
        confirmText="Delete Account"
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="page-container page-loading">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
