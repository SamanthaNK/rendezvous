import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Calendar, MapPin, Heart, Bookmark, Sparkles, X } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { selectIsAuthenticated } from '../../store/authSlice';
import { eventsAPI } from '../../services/api';
import { getRelativeDate } from '../../utils/dateHelpers';

const EventCard = ({
  event,
  onSaveToggle,
  onInterestedToggle,
  showExplanation = false,
  onNotInterested = null
}) => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [isSaved, setIsSaved] = useState(event.isSaved || false);
  const [isInterested, setIsInterested] = useState(event.isInterested || false);
  const [interestedCount, setInterestedCount] = useState(event.metrics?.interested || 0);
  const [actionLoading, setActionLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const handleCardClick = () => {
    navigate(`/events/${event._id}`);
  };

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(true);
      const newSavedState = !isSaved;

      if (newSavedState) {
        await eventsAPI.save(event._id);
      } else {
        await eventsAPI.unsave(event._id);
      }

      setIsSaved(newSavedState);
      if (onSaveToggle) {
        onSaveToggle(event._id, newSavedState);
      }
    } catch (error) {
      console.error('Save toggle error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInterestedClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(true);
      const newInterestedState = !isInterested;

      if (newInterestedState) {
        await eventsAPI.markInterested(event._id);
        setInterestedCount((prev) => prev + 1);
      } else {
        await eventsAPI.unmarkInterested(event._id);
        setInterestedCount((prev) => Math.max(0, prev - 1));
      }

      setIsInterested(newInterestedState);
      if (onInterestedToggle) {
        onInterestedToggle(event._id, newInterestedState);
      }
    } catch (error) {
      console.error('Interested toggle error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotInterested = (e) => {
    e.stopPropagation();
    setIsHidden(true);
    if (onNotInterested) {
      onNotInterested(event._id);
    }
  };

  if (isHidden) {
    return null;
  }

  const relativeDate = getRelativeDate(event.date);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 ease-out cursor-pointer flex flex-col relative"
      onClick={handleCardClick}
    >
      {onNotInterested && (
        <button
          onClick={handleNotInterested}
          className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          aria-label="Not interested"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      )}

      <div className="relative h-[180px] overflow-hidden bg-gray-100 flex-shrink-0">
        {event.images?.[0] ? (
          <img
            src={event.images[0]}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ImageIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}

        <button
          onClick={handleSaveClick}
          disabled={actionLoading}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 disabled:opacity-50 shadow-lg"
          aria-label={isSaved ? 'Remove from saved' : 'Save event'}
        >
          <Bookmark
            className={`w-5 h-5 transition-colors ${isSaved ? 'fill-teal text-teal' : 'text-gray-600'
              }`}
          />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {showExplanation && event.explanation && (
          <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-teal/5 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-teal flex-shrink-0" />
            <span className="font-body text-xs text-teal font-medium truncate">
              {event.explanation}
            </span>
          </div>
        )}

        <span className="inline-block px-3 py-1 bg-dark-amaranth/10 text-dark-amaranth text-xs font-semibold rounded-full mb-3 self-start">
          {event.categories?.[0] || 'Event'}
        </span>

        <h3 className="font-heading text-lg font-semibold text-ink-black mb-3 line-clamp-2 leading-snug">
          {event.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal flex-shrink-0" />
            <span className="font-body text-sm text-gray-600">
              {relativeDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal flex-shrink-0" />
            <span className="font-body text-sm text-gray-600 truncate">
              {event.location?.city || 'Location TBA'}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="font-body text-sm font-semibold text-ink-black">
            {event.isFree ? 'Free' : `${event.price} FCFA`}
          </span>

          <button
            onClick={handleInterestedClick}
            disabled={actionLoading}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <Heart
              className={`w-4 h-4 flex-shrink-0 transition-colors ${isInterested ? 'fill-lime-cream text-lime-cream' : 'text-gray-600'
                }`}
            />
            <span className="font-body text-sm text-gray-600">{interestedCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    categories: PropTypes.arrayOf(PropTypes.string),
    date: PropTypes.string.isRequired,
    location: PropTypes.shape({
      city: PropTypes.string,
    }),
    price: PropTypes.number,
    isFree: PropTypes.bool,
    images: PropTypes.arrayOf(PropTypes.string),
    metrics: PropTypes.shape({
      interested: PropTypes.number,
    }),
    isSaved: PropTypes.bool,
    isInterested: PropTypes.bool,
    explanation: PropTypes.string,
  }).isRequired,
  onSaveToggle: PropTypes.func,
  onInterestedToggle: PropTypes.func,
  showExplanation: PropTypes.bool,
  onNotInterested: PropTypes.func,
};

export default EventCard;