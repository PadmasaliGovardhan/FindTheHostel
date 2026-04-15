'use client';

import Link from 'next/link';
import StarRating, { getRatingColor, getRatingBg } from './StarRating';
import TagBadge, { generateTags, getWarningCategories } from './TagBadge';
import WarningBadge from './WarningBadge';

interface HostelStats {
  hostel_id: string;
  name: string;
  location: string;
  distance_from_klu_km: number;
  review_count: number;
  avg_food: number;
  avg_cleanliness: number;
  avg_staff: number;
  avg_room: number;
  avg_facilities: number;
  avg_overall: number;
}

interface HostelCardProps {
  hostel: HostelStats;
}

export default function HostelCard({ hostel }: HostelCardProps) {
  const tags = generateTags(hostel);
  const warnings = getWarningCategories(hostel);

  const ratingColor = hostel.review_count > 0 ? getRatingColor(hostel.avg_overall) : undefined;
  const ratingBg = hostel.review_count > 0 ? getRatingBg(hostel.avg_overall) : undefined;

  return (
    <Link href={`/hostel/${hostel.hostel_id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-interactive hostel-card" id={`hostel-card-${hostel.hostel_id}`}>
        <div className="hostel-card-header">
          <h3 className="hostel-card-name">{hostel.name}</h3>
          {hostel.review_count > 0 && (
            <div
              className="hostel-card-rating-badge"
              style={{
                background: ratingBg,
                color: ratingColor,
              }}
            >
              ★ {hostel.avg_overall.toFixed(1)}
            </div>
          )}
        </div>

        <div className="hostel-card-location">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1C4.79 1 3 2.79 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>
          </svg>
          <span>{hostel.location}</span>
          <span>•</span>
          <span>{hostel.distance_from_klu_km} km from campus</span>
        </div>

        {hostel.review_count > 0 && (
          <div className="hostel-card-meta">
            <StarRating rating={hostel.avg_overall} size="sm" />
            <span>{hostel.review_count} review{hostel.review_count !== 1 ? 's' : ''}</span>
          </div>
        )}

        {tags.length > 0 && (
          <div className="hostel-card-tags">
            {tags.slice(0, 4).map((tag, i) => (
              <TagBadge key={i} {...tag} />
            ))}
          </div>
        )}

        {warnings.length > 0 && <WarningBadge categories={warnings} />}

        {hostel.review_count === 0 && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            No reviews yet — be the first!
          </p>
        )}
      </div>
    </Link>
  );
}
