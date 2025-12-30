import PropTypes from 'prop-types';
import EventCard from './EventCard';
import { SkeletonCard } from '../common/Skeleton';

const EventGrid = ({ events, loading, onSaveToggle, onInterestedToggle }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="font-heading text-xl font-bold text-ink-black mb-2">
          No Events Found
        </h3>
        <p className="font-body text-base text-gray-600">
          Try adjusting your filters or check back later for new events
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event._id}
          event={event}
          onSaveToggle={onSaveToggle}
          onInterestedToggle={onInterestedToggle}
        />
      ))}
    </div>
  );
};

EventGrid.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  onSaveToggle: PropTypes.func,
  onInterestedToggle: PropTypes.func,
};

export default EventGrid;
