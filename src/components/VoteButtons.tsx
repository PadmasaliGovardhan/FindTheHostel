'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

interface VoteButtonsProps {
  reviewId: string;
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null;
  onVoteChange: () => void;
}

export default function VoteButtons({ reviewId, upvotes, downvotes, userVote, onVoteChange }: VoteButtonsProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const netVotes = upvotes - downvotes;

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      addToast('Please sign in to vote', 'warning');
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      if (userVote === voteType) {
        // Remove vote
        await supabase
          .from('review_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);
      } else if (userVote) {
        // Change vote
        await supabase
          .from('review_votes')
          .update({ vote_type: voteType })
          .eq('review_id', reviewId)
          .eq('user_id', user.id);
      } else {
        // New vote
        await supabase
          .from('review_votes')
          .insert({ review_id: reviewId, user_id: user.id, vote_type: voteType });
      }
      onVoteChange();
    } catch {
      addToast('Failed to vote', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <button
        className={`btn ${userVote === 'upvote' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        onClick={() => handleVote('upvote')}
        disabled={loading || !user}
        aria-label="True"
        title="Mark as true review"
        style={{ padding: '6px 12px', fontSize: 'var(--font-size-sm)', transition: 'all 0.2s' }}
      >
        {userVote === 'upvote' ? '✅' : '✔️'} True {upvotes > 0 ? `(${upvotes})` : ''}
      </button>
      <button
        className={`btn ${userVote === 'downvote' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
        onClick={() => handleVote('downvote')}
        disabled={loading || !user}
        aria-label="False"
        title="Mark as false review"
        style={{ padding: '6px 12px', fontSize: 'var(--font-size-sm)', transition: 'all 0.2s' }}
      >
        ❌ False {downvotes > 0 ? `(${downvotes})` : ''}
      </button>
    </div>
  );
}
