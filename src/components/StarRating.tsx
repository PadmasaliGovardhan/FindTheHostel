'use client';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

function getRatingColor(rating: number): string {
  if (rating >= 4.0) return 'var(--color-rating-great)';
  if (rating >= 3.0) return 'var(--color-rating-good)';
  if (rating >= 2.0) return 'var(--color-rating-avg)';
  return 'var(--color-rating-poor)';
}

function getRatingBg(rating: number): string {
  if (rating >= 4.0) return 'var(--color-rating-great-bg)';
  if (rating >= 3.0) return 'var(--color-rating-good-bg)';
  if (rating >= 2.0) return 'var(--color-rating-avg-bg)';
  return 'var(--color-rating-poor-bg)';
}

export { getRatingColor, getRatingBg };

export default function StarRating({ rating, size = 'md', showValue = false }: StarRatingProps) {
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2;
  const color = getRatingColor(rating);

  const fontSize = size === 'sm' ? '0.875rem' : size === 'lg' ? '1.5rem' : '1.125rem';

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(roundedRating)) {
      stars.push(
        <span key={i} className="star filled" style={{ fontSize, color }}>★</span>
      );
    } else if (i === Math.ceil(roundedRating) && roundedRating % 1 !== 0) {
      stars.push(
        <span key={i} className="star filled" style={{ fontSize, color, opacity: 0.5 }}>★</span>
      );
    } else {
      stars.push(
        <span key={i} className="star" style={{ fontSize }}>★</span>
      );
    }
  }

  return (
    <div className="star-rating">
      {stars}
      {showValue && (
        <span style={{
          marginLeft: '0.375rem',
          fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
          fontWeight: 600,
          color,
        }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
