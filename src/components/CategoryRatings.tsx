'use client';

import StarRating, { getRatingColor } from './StarRating';

interface CategoryRatingsProps {
  avgFood: number;
  avgCleanliness: number;
  avgStaff: number;
  avgRoom: number;
  avgFacilities: number;
}

const categories = [
  { key: 'food', label: 'Food Quality', emoji: '🍽️' },
  { key: 'cleanliness', label: 'Cleanliness', emoji: '🧹' },
  { key: 'staff', label: 'Owner/Staff Behavior', emoji: '👤' },
  { key: 'room', label: 'Room Comfort', emoji: '🛏️' },
  { key: 'facilities', label: 'Facilities (WiFi, Water, Power)', emoji: '⚡' },
];

export default function CategoryRatings({ avgFood, avgCleanliness, avgStaff, avgRoom, avgFacilities }: CategoryRatingsProps) {
  const values: Record<string, number> = {
    food: avgFood,
    cleanliness: avgCleanliness,
    staff: avgStaff,
    room: avgRoom,
    facilities: avgFacilities,
  };

  return (
    <div className="category-ratings">
      {categories.map((cat) => {
        const value = values[cat.key];
        const isLow = value > 0 && value < 2.5;
        const ratingColor = value > 0 ? getRatingColor(value) : undefined;
        return (
          <div key={cat.key} className={`category-rating-item ${isLow ? 'category-rating-low' : ''}`}>
            <span className="category-rating-label">{cat.emoji} {cat.label}</span>
            <div className="category-rating-value">
              <span className="category-rating-number" style={{ color: ratingColor }}>
                {value > 0 ? value.toFixed(1) : '—'}
              </span>
              {value > 0 && <StarRating rating={value} size="sm" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
