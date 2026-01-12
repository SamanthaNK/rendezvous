import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Bookmark } from 'lucide-react';
import { eventsAPI } from '../services/api';
import Container from '../layouts/Container';
import EventGrid from '../components/event/EventGrid';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';

const SavedEventsPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('saved');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchEvents();
    }, [activeTab, currentPage]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            let response;

            if (activeTab === 'saved') {
                response = await eventsAPI.getSaved({ page: currentPage, limit: 12 });
            } else {
                response = await eventsAPI.getInterested({ page: currentPage, limit: 12 });
            }

            if (response.data.success) {
                setEvents(response.data.data.events);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Fetch events error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleSaveToggle = (eventId, newSavedState) => {
        if (!newSavedState && activeTab === 'saved') {
            setEvents(events.filter(e => e._id !== eventId));
        }
    };

    const handleInterestedToggle = (eventId, newInterestedState) => {
        if (!newInterestedState && activeTab === 'interested') {
            setEvents(events.filter(e => e._id !== eventId));
        }
    };

    return (
        <div className="pt-20 min-h-screen bg-bright-snow">
            <Container className="py-12">
                <div className="mb-8">
                    <h1 className="font-heading text-4xl font-bold text-ink-black mb-2">
                        My Events
                    </h1>
                    <p className="font-body text-base text-gray-600">
                        Events you have saved or marked as interested
                    </p>
                </div>

                <div className="flex gap-3 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => {
                            setActiveTab('saved');
                            setCurrentPage(1);
                        }}
                        className={`px-6 py-3 font-body text-base font-semibold transition-all flex items-center gap-2 ${activeTab === 'saved'
                            ? 'text-teal border-b-2 border-teal'
                            : 'text-gray-600 hover:text-teal'
                            }`}
                    >
                        <Bookmark className="w-5 h-5" />
                        Saved Events
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('interested');
                            setCurrentPage(1);
                        }}
                        className={`px-6 py-3 font-body text-base font-semibold transition-all flex items-center gap-2 ${activeTab === 'interested'
                            ? 'text-teal border-b-2 border-teal'
                            : 'text-gray-600 hover:text-teal'
                            }`}
                    >
                        <Heart className="w-5 h-5" />
                        Interested
                    </button>
                </div>

                {!loading && events.length === 0 ? (
                    <EmptyState
                        icon={activeTab === 'saved' ? Bookmark : Heart}
                        title={activeTab === 'saved' ? 'No Saved Events' : 'No Interested Events'}
                        description={
                            activeTab === 'saved'
                                ? 'Start saving events to see them here'
                                : 'Mark events you are interested in to see them here'
                        }
                        actionLabel="Discover Events"
                        onAction={() => navigate('/')}
                    />
                ) : (
                    <>
                        <EventGrid
                            events={events}
                            loading={loading}
                            onSaveToggle={handleSaveToggle}
                            onInterestedToggle={handleInterestedToggle}
                        />

                        {!loading && events.length > 0 && currentPage < totalPages && (
                            <div className="mt-12 text-center">
                                <Button variant="secondary" size="lg" onClick={handleLoadMore}>
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
};

export default SavedEventsPage;