'use client';

interface TagBadgeProps {
  label: string;
  type: 'positive' | 'negative' | 'neutral';
}

export default function TagBadge({ label, type }: TagBadgeProps) {
  return (
    <span className={`tag tag-${type}`}>
      {type === 'positive' && '✓ '}
      {type === 'negative' && '✗ '}
      {label}
    </span>
  );
}

export function generateTags(stats: {
  avg_food: number;
  avg_cleanliness: number;
  avg_staff: number;
  avg_room: number;
  avg_facilities: number;
}): TagBadgeProps[] {
  const tags: TagBadgeProps[] = [];
  const categories = [
    { key: 'avg_food', positive: 'Good Food', negative: 'Poor Food' },
    { key: 'avg_cleanliness', positive: 'Clean Rooms', negative: 'Cleanliness Issues' },
    { key: 'avg_staff', positive: 'Friendly Staff', negative: 'Staff Issues' },
    { key: 'avg_room', positive: 'Comfortable Rooms', negative: 'Room Issues' },
    { key: 'avg_facilities', positive: 'Good Facilities', negative: 'Poor Facilities' },
  ];

  for (const cat of categories) {
    const val = stats[cat.key as keyof typeof stats];
    if (val >= 4.0) {
      tags.push({ label: cat.positive, type: 'positive' });
    } else if (val > 0 && val <= 2.0) {
      tags.push({ label: cat.negative, type: 'negative' });
    }
  }

  return tags;
}

export function getWarningCategories(stats: {
  avg_food: number;
  avg_cleanliness: number;
  avg_staff: number;
  avg_room: number;
  avg_facilities: number;
}): string[] {
  const warnings: string[] = [];
  if (stats.avg_food > 0 && stats.avg_food < 2.5) warnings.push('food');
  if (stats.avg_cleanliness > 0 && stats.avg_cleanliness < 2.5) warnings.push('cleanliness');
  if (stats.avg_staff > 0 && stats.avg_staff < 2.5) warnings.push('staff');
  if (stats.avg_room > 0 && stats.avg_room < 2.5) warnings.push('room');
  if (stats.avg_facilities > 0 && stats.avg_facilities < 2.5) warnings.push('facilities');
  return warnings;
}
