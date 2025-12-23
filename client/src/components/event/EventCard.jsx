import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, Calendar, Users, Check } from 'lucide-react';

/*
 * Usage Example:
 *
 * const sampleEvent = {
 *   id: '1',
 *   title: 'Summer Music Festival 2025',
 *   image: '/event-image.jpg',
 *   category: 'Music',
 *   date: '2025-12-25T20:00:00Z',
 *   location: 'Limbe Beach, Cameroon',
 *   price: 25,
 *   interestedCount: 1247,
 *   organizer: {
 *     name: 'EventPro Cameroon',
 *     verified: true
 *   }
 * };
 *
 * <EventCard
 *   event={sampleEvent}
 *   isBookmarked={false}
 *   onBookmarkToggle={(eventId) => console.log('Toggle bookmark for', eventId)}
 * />
 */

const EventCard = ({
  event,
  onBookmarkToggle,
  isBookmarked = false,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    onBookmarkToggle?.(event.id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isTonight = () => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return eventDate >= today && eventDate < tomorrow;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${className}`}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative h-[180px] overflow-hidden">
        <img
          src={event.image || '/placeholder-event.jpg'}
          alt={event.title}
          className="w-full h-full object-cover"
        />

        {/* Tonight Badge */}
        {isTonight() && (
          <div className="absolute top-3 left-3 bg-lime-cream/80 text-ink-black px-2 py-1 rounded-full text-xs font-semibold">
                        Tonight
          </div>
        )}

        {/* Bookmark Button */}
        <button
          onClick={handleBookmarkClick}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
        >
          <Bookmark
            size={16}
            className={isBookmarked ? 'fill-teal text-teal' : 'text-gray-600'}
          />
        </button>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3 bg-teal text-white px-2 py-1 rounded-full text-xs font-semibold">
          {event.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Event Title */}
        <h3 className="font-body font-semibold text-ink-black text-lg mb-3 overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.4',
        }}>
          {event.title}
        </h3>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} />
            <div>
              <div className="font-medium">{formatDate(event.date)}</div>
              <div className="text-xs">{formatTime(event.date)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} />
            <div className="truncate" title={event.location}>
              {event.location}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-teal">
              {event.price === 0 ? 'Free' : `$${event.price}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={14} />
            <span>{event.interestedCount || 0} interested</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">by</span>
            <span className="font-medium text-ink-black">{event.organizer.name}</span>
            {event.organizer.verified && (
              <div className="flex items-center gap-1 text-teal">
                <Check size={12} />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    image: PropTypes.string,
    category: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    interestedCount: PropTypes.number,
    organizer: PropTypes.shape({
      name: PropTypes.string.isRequired,
      verified: PropTypes.bool,
    }).isRequired,
  }).isRequired,
  onBookmarkToggle: PropTypes.func,
  isBookmarked: PropTypes.bool,
  className: PropTypes.string,
};

export default EventCard;
