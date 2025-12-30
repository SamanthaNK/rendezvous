import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Calendar,
  MapPin,
  Clock,
  Banknote,
  Heart,
  Bookmark,
  Share2,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { selectIsAuthenticated } from '../store/authSlice';
import { eventsAPI } from '../services/api';
import Container from '../layouts/Container';
import Button from '../components/common/Button';
import EventCard from '../components/event/EventCard';
import Spinner from '../components/common/Spinner';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [event, setEvent] = useState(null);
  const [similarEvents, setSimilarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getById(id);

      if (response.data.success) {
        const eventData = response.data.data.event;
        setEvent(eventData);
        setIsSaved(eventData.isSaved || false);
        setIsInterested(eventData.isInterested || false);
        setInterestedCount(eventData.metrics?.interested || 0);

        fetchSimilarEvents(eventData.categories?.[0]);
      }
    } catch (error) {
      console.error('Fetch event details error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarEvents = async (category) => {
    try {
      const response = await eventsAPI.getAll({
        category,
        limit: 3,
      });

      if (response.data.success) {
        const filtered = response.data.data.events.filter((e) => e._id !== id);
        setSimilarEvents(filtered.slice(0, 3));
      }
    } catch (error) {
      console.error('Fetch similar events error:', error);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(true);
      const newSavedState = !isSaved;

      if (newSavedState) {
        await eventsAPI.save(id);
      } else {
        await eventsAPI.unsave(id);
      }

      setIsSaved(newSavedState);
    } catch (error) {
      console.error('Save toggle error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInterested = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(true);
      const newInterestedState = !isInterested;

      if (newInterestedState) {
        await eventsAPI.markInterested(id);
        setInterestedCount((prev) => prev + 1);
      } else {
        await eventsAPI.unmarkInterested(id);
        setInterestedCount((prev) => Math.max(0, prev - 1));
      }

      setIsInterested(newInterestedState);
    } catch (error) {
      console.error('Interested toggle error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="pt-20">
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden bg-gray-100">
        <img
          src={event.images?.[0] || '/placeholder-event.jpg'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-black/60 to-transparent" />
      </div>

      <Container className="py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 lg:w-2/3">
            <div className="space-y-6">
              <div>
                <span className="inline-block px-3 py-1 bg-dark-amaranth/10 text-dark-amaranth text-sm font-semibold rounded-full mb-4">
                  {event.categories?.[0] || 'Event'}
                </span>
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-ink-black mb-4">
                  {event.title}
                </h1>
              </div>

              <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                <Link
                  to={`/organizers/${event.organizer?._id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center">
                    <span className="font-heading text-lg font-bold text-teal">
                      {event.organizer?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-body text-base font-semibold text-ink-black">
                      {event.organizer?.name}
                    </p>
                    {event.organizer?.isVerified && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        <span className="font-body text-sm text-gray-600">Verified Organizer</span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>

              <div>
                <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                  About This Event
                </h2>
                <p className="font-body text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              {event.socialLinks && Object.keys(event.socialLinks).some((key) => event.socialLinks[key]) && (
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-heading text-xl font-bold text-ink-black mb-4">
                    Follow Event Updates
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {event.socialLinks.facebook && (
                      <a
                        href={event.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-200 rounded-md font-body text-sm font-medium text-gray-700 hover:border-teal hover:text-teal transition-colors flex items-center gap-2"
                      >
                        Facebook
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {event.socialLinks.instagram && (
                      <a
                        href={event.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-200 rounded-md font-body text-sm font-medium text-gray-700 hover:border-teal hover:text-teal transition-colors flex items-center gap-2"
                      >
                        Instagram
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {event.socialLinks.website && (
                      <a
                        href={event.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-200 rounded-md font-body text-sm font-medium text-gray-700 hover:border-teal hover:text-teal transition-colors flex items-center gap-2"
                      >
                        Website
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm text-gray-500">Date & Time</p>
                      <p className="font-body text-base font-semibold text-ink-black">
                        {formatDate(event.date)}
                      </p>
                      <p className="font-body text-sm text-gray-600">{event.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm text-gray-500">Location</p>
                      <p className="font-body text-base font-semibold text-ink-black">
                        {event.location?.venue}
                      </p>
                      <p className="font-body text-sm text-gray-600">
                        {event.location?.address}, {event.location?.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm text-gray-500">Price</p>
                      <p className="font-body text-base font-semibold text-ink-black">
                        {event.isFree ? 'Free' : `${event.price} FCFA`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-lime-cream fill-lime-cream flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm text-gray-500">Interested</p>
                      <p className="font-body text-base font-semibold text-ink-black">
                        {interestedCount} {interestedCount === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleInterested}
                    disabled={actionLoading}
                    icon={Heart}
                    iconPosition="left"
                  >
                    {isInterested ? 'Interested' : "I'm Interested"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={handleSave}
                    disabled={actionLoading}
                    icon={Bookmark}
                    iconPosition="left"
                  >
                    {isSaved ? 'Saved' : 'Save Event'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onClick={handleShare}
                    icon={shareSuccess ? CheckCircle : Share2}
                    iconPosition="left"
                  >
                    {shareSuccess ? 'Link Copied!' : 'Share Event'}
                  </Button>
                </div>
              </div>

              <div className="bg-gray-100 rounded-xl overflow-hidden h-64 flex items-center justify-center">
                <div className="text-center p-6">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-body text-sm text-gray-600">
                    Map integration coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {similarEvents.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-200">
            <h2 className="font-heading text-3xl font-bold text-ink-black mb-8">
              Similar Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarEvents.map((similarEvent) => (
                <EventCard key={similarEvent._id} event={similarEvent} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default EventDetailsPage;