'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import StarRating from '@/components/StarRating';
import CategoryRatings from '@/components/CategoryRatings';
import WarningBadge from '@/components/WarningBadge';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import EmptyState from '@/components/EmptyState';
import { getWarningCategories } from '@/components/TagBadge';

interface HostelDetail {
  id: string;
  name: string;
  location: string;
  distance_from_klu_km: number;
  status: string;
}

interface HostelStatsData {
  review_count: number;
  avg_food: number;
  avg_cleanliness: number;
  avg_staff: number;
  avg_room: number;
  avg_facilities: number;
  avg_overall: number;
  recommend_percentage: number;
}

interface ReviewData {
  id: string;
  user_id: string;
  text: string;
  food_rating: number;
  cleanliness_rating: number;
  staff_rating: number;
  room_rating: number;
  facilities_rating: number;
  recommend: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: { display_name: string };
  upvotes: number;
  downvotes: number;
  user_vote: 'upvote' | 'downvote' | null;
  report_count: number;
  user_has_reported: boolean;
}

export default function HostelDetailPage() {
  const params = useParams();
  const hostelId = params.id as string;
  const { user } = useAuth();
  const supabase = createClient();

  const [hostel, setHostel] = useState<HostelDetail | null>(null);
  const [stats, setStats] = useState<HostelStatsData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [userReview, setUserReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'helpful' | 'recent'>('helpful');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  const fetchHostel = useCallback(async () => {
    const { data } = await supabase
      .from('hostels')
      .select('id, name, location, distance_from_klu_km, status')
      .eq('id', hostelId)
      .single();
    setHostel(data);
  }, [hostelId, supabase]);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase
      .from('hostel_stats')
      .select('review_count, avg_food, avg_cleanliness, avg_staff, avg_room, avg_facilities, avg_overall, recommend_percentage')
      .eq('hostel_id', hostelId)
      .single();
    setStats(data);
  }, [hostelId, supabase]);

  const fetchReviews = useCallback(async () => {
    // Fetch all reviews with profiles in a single query
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, profiles!inner(display_name)')
      .eq('hostel_id', hostelId);

    if (!reviewsData || reviewsData.length === 0) {
      setReviews([]);
      setUserReview(null);
      return;
    }

    const reviewIds = reviewsData.map((r: any) => r.id);

    // Batch fetch all votes for these reviews in ONE query
    const { data: allVotes } = await supabase
      .from('review_votes')
      .select('review_id, vote_type, user_id')
      .in('review_id', reviewIds);

    // Batch fetch all reports for these reviews in ONE query
    const { data: allReports } = await supabase
      .from('review_reports')
      .select('review_id, user_id')
      .in('review_id', reviewIds);

    // Build enriched reviews from batch data
    const enriched = reviewsData.map((review: any) => {
      const reviewVotes = allVotes?.filter((v: any) => v.review_id === review.id) || [];
      const upvotes = reviewVotes.filter((v: any) => v.vote_type === 'upvote').length;
      const downvotes = reviewVotes.filter((v: any) => v.vote_type === 'downvote').length;

      const userVote = user
        ? (reviewVotes.find((v: any) => v.user_id === user.id)?.vote_type as 'upvote' | 'downvote' | null) ?? null
        : null;

      const reviewReports = allReports?.filter((r: any) => r.review_id === review.id) || [];
      const reportCount = reviewReports.length;
      const userHasReported = user
        ? reviewReports.some((r: any) => r.user_id === user.id)
        : false;

      return {
        ...review,
        upvotes,
        downvotes,
        user_vote: userVote,
        report_count: reportCount,
        user_has_reported: userHasReported,
      };
    });

    // Find user's review
    if (user) {
      const myReview = enriched.find((r: any) => r.user_id === user.id);
      setUserReview(myReview || null);
    }

    setReviews(enriched);
  }, [hostelId, user, supabase]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchHostel(), fetchStats(), fetchReviews()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchHostel, fetchStats, fetchReviews]);

  // Sort reviews
  const sortedReviews = [...reviews]
    .filter((r: any) => r.user_id !== user?.id) // Exclude user's own review from list (shown separately)
    .sort((a, b) => {
      if (sortBy === 'helpful') {
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const warnings = stats ? getWarningCategories(stats) : [];

  if (loading) {
    return (
      <div className="page-container page-loading">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="page-container">
        <EmptyState
          icon="❌"
          title="Hostel not found"
          description="This hostel doesn't exist or may have been removed."
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="hostel-detail-header">
        <h1 className="hostel-detail-title" id="hostel-name">{hostel.name}</h1>
        <div className="hostel-detail-meta">
          <span className="hostel-detail-stat">
            📍 {hostel.location}
          </span>
          <span className="hostel-detail-stat">
            🚶 {hostel.distance_from_klu_km} km from campus
          </span>
          {stats && stats.review_count > 0 && (
            <span className="hostel-detail-stat">
              💬 {stats.review_count} review{stats.review_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {stats && stats.review_count > 0 && (
          <div className="hostel-detail-overall">
            <span className="hostel-detail-overall-number">{stats.avg_overall.toFixed(1)}</span>
            <div>
              <StarRating rating={stats.avg_overall} size="lg" />
              <span className="hostel-detail-overall-label">
                {stats.recommend_percentage.toFixed(0)}% recommend
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Warning Banner */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <WarningBadge categories={warnings} variant="banner" />
        </div>
      )}

      {/* Category Ratings */}
      {stats && stats.review_count > 0 && (
        <div className="hostel-detail-section">
          <h2 className="hostel-detail-section-title">Category Ratings</h2>
          <CategoryRatings
            avgFood={stats.avg_food}
            avgCleanliness={stats.avg_cleanliness}
            avgStaff={stats.avg_staff}
            avgRoom={stats.avg_room}
            avgFacilities={stats.avg_facilities}
          />
        </div>
      )}

      {/* Write / Edit Review */}
      {user && (
        <div className="hostel-detail-section">
          {userReview && !editingReview ? (
            <div className="card" id="user-existing-review">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 className="hostel-detail-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                  Your Review
                </h2>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingReview(true)}
                >
                  ✏️ Edit
                </button>
              </div>
              <ReviewCard review={userReview} onVoteChange={fetchReviews} />
            </div>
          ) : userReview && editingReview ? (
            <div className="card">
              <ReviewForm
                hostelId={hostelId}
                existingReview={userReview}
                onSuccess={() => {
                  setEditingReview(false);
                  fetchReviews();
                  fetchStats();
                }}
                onCancel={() => setEditingReview(false)}
              />
            </div>
          ) : !userReview && !showReviewForm ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                Have you stayed at this hostel? Share your experience!
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowReviewForm(true)}
                id="write-review-btn"
              >
                ✍️ Write a Review
              </button>
            </div>
          ) : !userReview && showReviewForm ? (
            <div className="card">
              <ReviewForm
                hostelId={hostelId}
                onSuccess={() => {
                  setShowReviewForm(false);
                  fetchReviews();
                  fetchStats();
                }}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Reviews List */}
      <div className="hostel-detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 className="hostel-detail-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            Student Reviews
          </h2>
          <div className="sort-tabs">
            <button
              className={`sort-tab ${sortBy === 'helpful' ? 'active' : ''}`}
              onClick={() => setSortBy('helpful')}
            >
              Most Helpful
            </button>
            <button
              className={`sort-tab ${sortBy === 'recent' ? 'active' : ''}`}
              onClick={() => setSortBy('recent')}
            >
              Most Recent
            </button>
          </div>
        </div>

        {sortedReviews.length > 0 ? (
          <div className="card" style={{ padding: 0 }}>
            {sortedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} onVoteChange={fetchReviews} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📝"
            title="No reviews yet"
            description="Be the first KL student to review this hostel."
            action={
              user && !userReview ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowReviewForm(true)}
                >
                  Write the First Review
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
