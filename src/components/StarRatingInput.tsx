'use client';

import { useState } from 'react';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export default function StarRatingInput({ value, onChange, label }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="form-rating-item">
      {label && <span className="form-label">{label}</span>}
      <div className="star-rating-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= (hoverValue || value) ? 'active' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
