import PropTypes from 'prop-types';
import EventCard from './EventCard';
import { SkeletonCard } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import { Calendar } from 'lucide-react';

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
      <EmptyState
        icon={Calendar}
        title="No Events Found"
        description="Try adjusting your filters or check back later for new events"
      />
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
