'use client';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  minRating: string;
  onMinRatingChange: (rating: string) => void;
  maxDistance: string;
  onMaxDistanceChange: (distance: string) => void;
}

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  minRating,
  onMinRatingChange,
  maxDistance,
  onMaxDistanceChange,
}: SearchFilterProps) {
  return (
    <div className="search-filter-bar" id="search-filter-bar">
      <input
        className="search-filter-input"
        type="text"
        placeholder="🔍 Search hostels by name..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        id="hostel-search-input"
      />

      <select
        className="filter-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        id="sort-select"
      >
        <option value="top_rated">⭐ Top Rated</option>
        <option value="most_reviewed">💬 Most Reviewed</option>
        <option value="nearest">📍 Nearest</option>
      </select>

      <select
        className="filter-select"
        value={minRating}
        onChange={(e) => onMinRatingChange(e.target.value)}
        id="min-rating-select"
      >
        <option value="">Min Rating</option>
        <option value="4">4+ Stars</option>
        <option value="3">3+ Stars</option>
        <option value="2">2+ Stars</option>
      </select>

      <select
        className="filter-select"
        value={maxDistance}
        onChange={(e) => onMaxDistanceChange(e.target.value)}
        id="max-distance-select"
      >
        <option value="">Any Distance</option>
        <option value="1">Within 1 km</option>
        <option value="2">Within 2 km</option>
        <option value="5">Within 5 km</option>
        <option value="10">Within 10 km</option>
      </select>
    </div>
  );
}
