import React, { useState } from 'react';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
];

const ReviewsList = ({ reviews, averageRating }) => {
  const [sort, setSort] = useState('newest');

  const sorted = [...reviews].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'highest') return b.rating - a.rating;
    if (sort === 'lowest') return a.rating - b.rating;
    return 0;
  });

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="font-heading text-lg font-bold">
          Reviews
          {typeof averageRating === 'number' && (
            <span className="ml-3 text-base font-medium text-yellow-500">★ {averageRating.toFixed(1)}</span>
          )}
        </div>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {sorted.length === 0 ? (
        <div className="text-gray-500">No reviews yet.</div>
      ) : (
        <ul className="space-y-4">
          {sorted.map((r) => (
            <li key={r._id} className="border-b last:border-0 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <img src={r.user?.profilePicture || '/default-avatar.png'} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                <span className="font-semibold">{r.user?.name || 'User'}</span>
                <span className="text-yellow-500 ml-2">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-xs text-gray-400 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment && <div className="text-gray-700 text-sm ml-11">{r.comment}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewsList;
