
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser } from '../store/authSlice';
import { eventsAPI, userAPI, reviewsAPI } from '../services/api';
import ReviewForm from '../components/review/ReviewForm';
import ReviewsList from '../components/review/ReviewsList';
// ...existing imports...
import Container from '../layouts/Container';
import Button from '../components/common/Button';
import EventCard from '../components/event/EventCard';
import Spinner from '../components/common/Spinner';
import { formatDate } from '../utils/dateHelpers';

const ImageGallery = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;
  if (images.length === 1) return null; // No gallery needed for single image

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="mt-6">
      <h3 className="font-heading text-lg font-semibold text-ink-black mb-4">
        More Photos ({images.length})
      </h3>

      <div className="relative">
        {/* Main Image */}
        <div className="relative h-96 bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={images[currentIndex]}
            alt={`${title} - Photo ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-ink-black" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 text-ink-black" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-ink-black/70 text-white text-sm rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${currentIndex === index
                ? 'border-teal scale-105'
                : 'border-gray-200 hover:border-gray-400'
                }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // All state declarations first
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [similarEvents, setSimilarEvents] = useState([]);
  const [similarTotal, setSimilarTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Effects and handlers after all state declarations
  useEffect(() => {
    if (event && event.organizer?._id && currentUser && currentUser.followedOrganizers) {
      setIsFollowing(currentUser.followedOrganizers.includes(event.organizer._id));
    }
  }, [event, currentUser]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!event?.organizer?._id) return;
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await userAPI.unfollowOrganizer(event.organizer._id);
        setIsFollowing(false);
      } else {
        await userAPI.followOrganizer(event.organizer._id);
        setIsFollowing(true);
      }
    } catch (err) {
      // Optionally show error
    } finally {
      setFollowLoading(false);
    }
  };

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

        fetchSimilarEvents();
        fetchReviews();
      }
    } catch (error) {
      console.error('Fetch event details error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getByEvent(id);
      if (response.data.success) {
        setReviews(response.data.data.reviews || []);
        setAverageRating(response.data.data.averageRating || 0);
      }
    } catch (error) {
      console.error('Fetch reviews error:', error);
    }
  };

  const fetchSimilarEvents = async () => {
    try {
      const response = await eventsAPI.getSimilar(id, { limit: 6 });
      if (response.data.success) {
        const events = response.data.data.events.filter((e) => e._id !== id);
        setSimilarEvents(events.slice(0, 5));
        setSimilarTotal(response.data.data.total || events.length);
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

  const handleReviewSubmit = async (rating, reviewText) => {
    if (!isAuthenticated || !event) return;

    try {
      setReviewLoading(true);
      const response = await reviewsAPI.create(event._id, {
        rating,
        comment: reviewText,
      });

      if (response.data.success) {
        setReviews([response.data.data.review, ...reviews]);
        setAverageRating(response.data.data.averageRating);
        setReviewModalOpen(false);
      }
    } catch (error) {
      console.error('Submit review error:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const formattedDate = event ? formatDate(event.date, 'long') : '';

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
        {event.images?.[0] ? (
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ImageIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}
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
                <Button
                  variant={isFollowing ? 'secondary' : 'primary'}
                  size="sm"
                  className="ml-2"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
              <div>
                <p className="font-body text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
              {event.images && event.images.length > 1 && (
                <ImageGallery images={event.images} title={event.title} />
              )}
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

              {/* Reviews Section (only for past events) */}
              {event.date && new Date(event.date) < new Date() && (
                <>
                  <div className="flex items-center justify-between mt-10 mb-2">
                    <h3 className="font-heading text-xl font-bold text-ink-black">Event Reviews</h3>
                    {isAuthenticated && (
                      <Button variant="primary" size="sm" onClick={() => setReviewModalOpen(true)}>
                        Leave a Review
                      </Button>
                    )}
                  </div>
                  <ReviewsList reviews={reviews} averageRating={averageRating} />
                  <ReviewForm open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} onSubmit={handleReviewSubmit} loading={reviewLoading} />
                </>
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
                        {formattedDate}
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
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-6 min-w-[600px]">
                {similarEvents.map((similarEvent) => (
                  <div key={similarEvent._id} className="w-72 flex-shrink-0">
                    <EventCard event={similarEvent} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default EventDetailsPage;