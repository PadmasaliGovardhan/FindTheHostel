'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import StarRatingInput from './StarRatingInput';
import PhotoUpload from './PhotoUpload';

interface ReviewFormProps {
  hostelId: string;
  existingReview?: {
    id: string;
    text: string;
    food_rating: number;
    cleanliness_rating: number;
    staff_rating: number;
    room_rating: number;
    facilities_rating: number;
    recommend: boolean;
    photo_url: string | null;
  };
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ hostelId, existingReview, onSuccess, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const supabase = createClient();

  const [foodRating, setFoodRating] = useState(existingReview?.food_rating || 0);
  const [cleanlinessRating, setCleanlinessRating] = useState(existingReview?.cleanliness_rating || 0);
  const [staffRating, setStaffRating] = useState(existingReview?.staff_rating || 0);
  const [roomRating, setRoomRating] = useState(existingReview?.room_rating || 0);
  const [facilitiesRating, setFacilitiesRating] = useState(existingReview?.facilities_rating || 0);
  const [text, setText] = useState(existingReview?.text || '');
  const [recommend, setRecommend] = useState<boolean | null>(existingReview?.recommend ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = !!existingReview;

  // Load draft from localStorage on mount (only if not editing an existing review)
  useEffect(() => {
    if (!isEditing) {
      const savedDraft = localStorage.getItem(`draft_review_${hostelId}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (!foodRating) setFoodRating(parsed.foodRating || 0);
          if (!cleanlinessRating) setCleanlinessRating(parsed.cleanlinessRating || 0);
          if (!staffRating) setStaffRating(parsed.staffRating || 0);
          if (!roomRating) setRoomRating(parsed.roomRating || 0);
          if (!facilitiesRating) setFacilitiesRating(parsed.facilitiesRating || 0);
          if (!text) setText(parsed.text || '');
          if (recommend === null) setRecommend(parsed.recommend ?? null);
        } catch (e) {
          // ignore parsing error
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelId, isEditing]);

  // Save draft to localStorage whenever fields change
  useEffect(() => {
    if (!isEditing) {
      const draft = {
        foodRating, cleanlinessRating, staffRating, roomRating, facilitiesRating, text, recommend
      };
      if (text || foodRating || recommend !== null) {
        localStorage.setItem(`draft_review_${hostelId}`, JSON.stringify(draft));
      } else {
        localStorage.removeItem(`draft_review_${hostelId}`);
      }
    }
  }, [hostelId, isEditing, foodRating, cleanlinessRating, staffRating, roomRating, facilitiesRating, text, recommend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    if (!foodRating || !cleanlinessRating || !staffRating || !roomRating || !facilitiesRating) {
      addToast('Please rate all categories', 'warning');
      return;
    }
    if (text.length < 10) {
      addToast('Review must be at least 10 characters', 'warning');
      return;
    }
    if (recommend === null) {
      addToast('Please select whether you would recommend this hostel', 'warning');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = existingReview?.photo_url || null;

      // Upload photo if new one selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('review-photos')
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
      }

      const reviewData = {
        hostel_id: hostelId,
        user_id: user.id,
        text,
        food_rating: foodRating,
        cleanliness_rating: cleanlinessRating,
        staff_rating: staffRating,
        room_rating: roomRating,
        facilities_rating: facilitiesRating,
        recommend,
        photo_url: photoUrl,
      };

      if (isEditing && existingReview) {
        const { error } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', existingReview.id);
        if (error) throw error;
        addToast('Review updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert(reviewData);
        if (error) {
          if (error.code === '23505') {
            addToast('You have already reviewed this hostel', 'warning');
          } else {
            throw error;
          }
          return;
        }
        addToast('Review submitted! Thank you for sharing.', 'success');
      }

      // Clear draft after successful submission
      if (!isEditing) {
        localStorage.removeItem(`draft_review_${hostelId}`);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      addToast('Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} id="review-form">
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-bold)' }}>
        {isEditing ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      <div className="form-group">
        <label className="form-label form-label-required">Rate each category</label>
        <div className="form-ratings-grid">
          <StarRatingInput label="🍽️ Food Quality" value={foodRating} onChange={setFoodRating} />
          <StarRatingInput label="🧹 Cleanliness" value={cleanlinessRating} onChange={setCleanlinessRating} />
          <StarRatingInput label="👤 Owner/Staff" value={staffRating} onChange={setStaffRating} />
          <StarRatingInput label="🛏️ Room Comfort" value={roomRating} onChange={setRoomRating} />
          <StarRatingInput label="⚡ Facilities" value={facilitiesRating} onChange={setFacilitiesRating} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label form-label-required" htmlFor="review-text">Your Experience</label>
        <textarea
          id="review-text"
          className="form-input form-textarea"
          placeholder="Share your real experience — food, cleanliness, owner behavior, issues faced…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          minLength={10}
          required
        />
        <span className="form-hint">{text.length} characters (minimum 10)</span>
      </div>

      <div className="form-group">
        <label className="form-label">Photo (optional)</label>
        <PhotoUpload currentUrl={existingReview?.photo_url} onFileSelect={setPhotoFile} />
      </div>

      <div className="form-group">
        <label className="form-label form-label-required">Would you recommend this hostel?</label>
        <div className="recommend-toggle">
          <button
            type="button"
            className={`recommend-option ${recommend === true ? 'selected-yes' : ''}`}
            onClick={() => setRecommend(true)}
          >
            👍 Yes
          </button>
          <button
            type="button"
            className={`recommend-option ${recommend === false ? 'selected-no' : ''}`}
            onClick={() => setRecommend(false)}
          >
            👎 No
          </button>
        </div>
      </div>

      <div className="form-disclaimer">
        Reviews reflect personal student experiences. Be honest and respectful.
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? (
            <><span className="spinner" /> Submitting...</>
          ) : (
            isEditing ? 'Update Review' : 'Submit Review'
          )}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary btn-lg" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
