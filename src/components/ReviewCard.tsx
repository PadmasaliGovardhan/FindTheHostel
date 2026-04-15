'use client';

import StarRating from './StarRating';
import VoteButtons from './VoteButtons';
import ReportButton from './ReportButton';

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

interface ReviewCardProps {
  review: ReviewData;
  onVoteChange: () => void;
}

export default function ReviewCard({ review, onVoteChange }: ReviewCardProps) {
  const avgRating = (
    review.food_rating +
    review.cleanliness_rating +
    review.staff_rating +
    review.room_rating +
    review.facilities_rating
  ) / 5;

  const isDimmed = (review.downvotes - review.upvotes) >= 3;
  const isDisputed = review.report_count >= 3;

  const date = new Date(review.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const ratingItems = [
    { label: 'Food', value: review.food_rating },
    { label: 'Clean', value: review.cleanliness_rating },
    { label: 'Staff', value: review.staff_rating },
    { label: 'Room', value: review.room_rating },
    { label: 'Facilities', value: review.facilities_rating },
  ];

  return (
    <div
      className={`review-card ${isDimmed ? 'review-card-dimmed' : ''} ${isDisputed ? 'review-card-disputed' : ''}`}
      id={`review-${review.id}`}
    >
      {isDisputed && (
        <div className="review-card-disputed-badge">
          ⚠️ Under review — credibility disputed
        </div>
      )}

      <div className="review-card-header">
        <div className="review-card-author">
          <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
            {review.profiles.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div className="review-card-author-name">{review.profiles.display_name}</div>
            <div className="review-card-date">{date}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <StarRating rating={avgRating} size="sm" showValue />
        </div>
      </div>

      <div className="review-card-ratings">
        {ratingItems.map((item) => (
          <div key={item.label} className="review-card-rating-item">
            <span>{item.label}</span>
            <StarRating rating={item.value} size="sm" />
          </div>
        ))}
      </div>

      <p className="review-card-text">{review.text}</p>

      {review.photo_url && (
        <img src={review.photo_url} alt="Review photo" className="review-card-photo" />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <span className={`review-card-recommend ${review.recommend ? 'yes' : 'no'}`}>
          {review.recommend ? '👍 Would recommend' : '👎 Would not recommend'}
        </span>
      </div>

      <div className="review-card-actions">
        <VoteButtons
          reviewId={review.id}
          upvotes={review.upvotes}
          downvotes={review.downvotes}
          userVote={review.user_vote}
          onVoteChange={onVoteChange}
        />
        <ReportButton reviewId={review.id} hasReported={review.user_has_reported} />
      </div>
    </div>
  );
}
