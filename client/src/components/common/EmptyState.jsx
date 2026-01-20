import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
    variant = 'default',
    userName,
    onAction
}) => {
    const navigate = useNavigate();

    // Cold start for new users with no interactions
    if (variant === 'cold-start') {
        return (
            <div className="text-center py-16 px-6 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-teal" />
                </div>

                <h2 className="font-heading text-3xl font-bold text-ink-black mb-4">
                    Welcome{userName ? `, ${userName}` : ''}!
                </h2>

                <p className="font-body text-base text-gray-700 mb-8 leading-relaxed">
                    Start saving and liking events to get personalized recommendations
                </p>

                <div className="bg-teal/5 rounded-xl p-6 mb-8 border border-teal/20 text-left">
                    <p className="font-body text-sm text-gray-700 mb-4">
                        <strong className="text-ink-black">How it works:</strong>
                    </p>
                    <ul className="font-body text-sm text-gray-700 space-y-2">
                        <li>• Save events you find interesting</li>
                        <li>• Mark events you want to attend</li>
                        <li>• We'll learn your preferences and suggest events you'll love</li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/')}
                    >
                        Explore Events
                    </Button>
                </div>
            </div>
        );
    }

    // Default empty state - no results found
    return (
        <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-heading text-xl font-bold text-ink-black mb-2">
                No Events Found
            </h3>
            <p className="font-body text-base text-gray-600 mb-6">
                Try adjusting your filters or check back later
            </p>
            {onAction && (
                <Button variant="primary" size="lg" onClick={onAction}>
                    Browse All Events
                </Button>
            )}
        </div>
    );
};

EmptyState.propTypes = {
    variant: PropTypes.oneOf(['default', 'cold-start']),
    userName: PropTypes.string,
    onAction: PropTypes.func,
};

export default EmptyState;