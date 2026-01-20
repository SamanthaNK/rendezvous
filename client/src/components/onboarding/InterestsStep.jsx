import { Calendar, Music, Palette, Utensils, Laptop, Trophy, Briefcase, Heart, Film, BookOpen, Dumbbell, Wine } from 'lucide-react';
import PropTypes from 'prop-types';
import { CATEGORIES } from '../../utils/constants';

const CATEGORY_ICONS = {
    'Music & Concerts': Music,
    'Arts & Culture': Palette,
    'Food & Drink': Utensils,
    'Technology': Laptop,
    'Sports & Fitness': Trophy,
    'Business & Networking': Briefcase,
    'Community & Charity': Heart,
    'Entertainment': Film,
    'Education & Workshops': BookOpen,
    'Health & Wellness': Dumbbell,
    'Nightlife': Wine,
    'Family & Kids': Calendar,
};

const InterestsStep = ({ selectedInterests, onInterestToggle }) => {
    return (
        <div className="w-full max-w-3xl mx-auto px-5 py-12">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-teal" />
                </div>
                <h1 className="font-heading text-4xl font-bold text-ink-black mb-4">
                    What interests you?
                </h1>
                <p className="font-body text-base text-gray-600 max-w-lg mx-auto">
                    Select your favorite categories to get personalized event recommendations. Choose at least one.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {CATEGORIES.map((category) => {
                    const Icon = CATEGORY_ICONS[category.id] || Calendar;
                    const isSelected = selectedInterests.includes(category.id);

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => onInterestToggle(category.id)}
                            className={`
                relative p-6 rounded-xl border-2 transition-all duration-200
                flex flex-col items-center gap-3
                ${isSelected
                                    ? 'bg-teal/5 border-teal shadow-md'
                                    : 'bg-white border-gray-200 hover:border-teal hover:bg-teal/5'
                                }
              `}
                        >
                            {isSelected && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-teal rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                            <Icon className={`w-8 h-8 ${isSelected ? 'text-teal' : 'text-gray-400'}`} />
                            <span className={`font-body text-sm font-medium text-center ${isSelected ? 'text-teal' : 'text-gray-700'}`}>
                                {category.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="text-center">
                <p className="font-body text-sm text-gray-600">
                    {selectedInterests.length} {selectedInterests.length === 1 ? 'category' : 'categories'} selected
                </p>
            </div>
        </div>
    );
};

InterestsStep.propTypes = {
    selectedInterests: PropTypes.array.isRequired,
    onInterestToggle: PropTypes.func.isRequired,
};

export default InterestsStep;