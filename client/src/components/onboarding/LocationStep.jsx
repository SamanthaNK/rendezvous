import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import PropTypes from 'prop-types';
import { CITIES } from '../../utils/constants';

const LocationStep = ({ city, onCityChange }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCities = CITIES.filter((c) =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full max-w-2xl mx-auto px-5 py-12">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-teal rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-white" />
                </div>
                <h1 className="font-heading text-4xl font-bold text-ink-black mb-4">
                    Where are you located?
                </h1>
                <p className="font-body text-base text-gray-600 max-w-lg mx-auto">
                    We'll show you events happening near you
                </p>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for your city..."
                        className="w-full pl-12 pr-4 py-3 font-body text-base border-[1.5px] border-gray-200 rounded-xl focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10 transition-all duration-200"
                    />
                </div>
            </div>

            <div className="bg-white border-[1.5px] border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                {filteredCities.length > 0 ? (
                    filteredCities.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => onCityChange(c.id)}
                            className={`
                w-full px-6 py-4 flex items-center gap-4 text-left transition-colors
                ${city === c.id ? 'bg-teal/5 border-l-4 border-teal' : 'hover:bg-gray-50 border-b border-gray-100'}
              `}
                        >
                            <MapPin className={`w-5 h-5 flex-shrink-0 ${city === c.id ? 'text-teal' : 'text-gray-400'}`} />
                            <div>
                                <p className={`font-body text-base font-medium ${city === c.id ? 'text-teal' : 'text-ink-black'}`}>
                                    {c.label}
                                </p>
                                <p className="font-body text-sm text-gray-500">{c.region}</p>
                            </div>
                            {city === c.id && (
                                <div className="ml-auto w-6 h-6 bg-teal rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))
                ) : (
                    <div className="px-6 py-12 text-center">
                        <p className="font-body text-base text-gray-500">No cities found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

LocationStep.propTypes = {
    city: PropTypes.string.isRequired,
    onCityChange: PropTypes.func.isRequired,
};

export default LocationStep;