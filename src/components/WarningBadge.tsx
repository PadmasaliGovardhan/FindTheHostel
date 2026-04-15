'use client';

interface WarningBadgeProps {
  categories: string[];
  variant?: 'badge' | 'banner';
}

const categoryLabels: Record<string, string> = {
  food: 'Food Quality',
  cleanliness: 'Cleanliness',
  staff: 'Owner/Staff Behavior',
  room: 'Room Comfort',
  facilities: 'Facilities',
};

export default function WarningBadge({ categories, variant = 'badge' }: WarningBadgeProps) {
  if (categories.length === 0) return null;

  const labels = categories.map((c) => categoryLabels[c] || c);

  if (variant === 'banner') {
    return (
      <div className="warning-banner" id="hostel-warning-banner">
        <span className="warning-badge-icon">⚠️</span>
        <span>Multiple students reported issues with: <strong>{labels.join(', ')}</strong></span>
      </div>
    );
  }

  return (
    <div className="warning-badge">
      <span className="warning-badge-icon">⚠️</span>
      <span>Issues: {labels.join(', ')}</span>
    </div>
  );
}
