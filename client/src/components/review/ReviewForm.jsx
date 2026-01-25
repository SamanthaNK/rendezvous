import React, { useState } from 'react';

const StarRating = ({ value, onChange, disabled }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewForm = ({ open, onClose, onSubmit, loading }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a rating.');
      return;
    }
    if (comment.length > 500) {
      setError('Comment must be 500 characters or less.');
      return;
    }
    setError('');
    onSubmit({ rating, comment });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h3 className="font-heading text-xl font-bold mb-4">Leave a Review</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-1">Your Rating</label>
            <StarRating value={rating} onChange={setRating} disabled={loading} />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Comment (optional)</label>
            <textarea
              className="border rounded px-2 py-1 w-full"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={e => setComment(e.target.value)}
              disabled={loading}
              placeholder="Share your experience (max 500 chars)"
            />
            <div className="text-xs text-gray-400 text-right">{comment.length}/500</div>
          </div>
          {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
          <div className="flex gap-3 mt-4">
            <button type="submit" className="px-4 py-2 bg-teal text-white rounded hover:bg-teal/80 font-bold" disabled={loading}>Submit</button>
            <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
