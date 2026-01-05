import PropTypes from 'prop-types';
import { Tag, MapPin, Banknote, Calendar, Sparkles } from 'lucide-react';

const ParsedParameters = ({ parsedQuery, originalQuery }) => {
    const { category, location, budget, timeframe, mood } = parsedQuery;

    const hasAnyParameters = category || location || budget.isFree || budget.maxPrice || timeframe || mood;

    if (!hasAnyParameters) {
        return (
            <div className="flex items-center gap-3 text-gray-600">
                <Sparkles className="w-5 h-5" />
                <p className="font-body text-sm">
                    Showing all results for <span className="font-semibold text-ink-black">"{originalQuery}"</span>
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal" />
                <p className="font-body text-sm text-gray-600">
                    AI understood your search as:
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                {category && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-amaranth/10 text-dark-amaranth rounded-full">
                        <Tag className="w-4 h-4" />
                        <span className="font-body text-sm font-semibold">{category}</span>
                    </div>
                )}

                {location && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 text-teal rounded-full">
                        <MapPin className="w-4 h-4" />
                        <span className="font-body text-sm font-semibold">{location}</span>
                    </div>
                )}

                {budget.isFree && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-cream/50 text-ink-black rounded-full">
                        <Banknote className="w-4 h-4" />
                        <span className="font-body text-sm font-semibold">Free Events</span>
                    </div>
                )}

                {budget.maxPrice && !budget.isFree && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-cream/50 text-ink-black rounded-full">
                        <Banknote className="w-4 h-4" />
                        <span className="font-body text-sm font-semibold">
                            Under {budget.maxPrice} FCFA
                        </span>
                    </div>
                )}

                {timeframe && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-info/10 text-info rounded-full">
                        <Calendar className="w-4 h-4" />
                        <span className="font-body text-sm font-semibold">
                            {timeframe === 'today' && 'Today'}
                            {timeframe === 'tomorrow' && 'Tomorrow'}
                            {timeframe === 'weekend' && 'This Weekend'}
                            {timeframe === 'week' && 'This Week'}
                            {timeframe === 'month' && 'This Month'}
                        </span>
                    </div>
                )}

                {mood && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-body text-sm font-semibold capitalize">{mood}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

ParsedParameters.propTypes = {
    parsedQuery: PropTypes.shape({
        category: PropTypes.string,
        location: PropTypes.string,
        budget: PropTypes.shape({
            isFree: PropTypes.bool,
            maxPrice: PropTypes.number,
        }),
        timeframe: PropTypes.string,
        mood: PropTypes.string,
    }).isRequired,
    originalQuery: PropTypes.string.isRequired,
};

export default ParsedParameters;