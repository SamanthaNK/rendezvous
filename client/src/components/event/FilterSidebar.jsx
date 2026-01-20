import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Calendar, MapPin, Banknote, Tag } from 'lucide-react';
import Button from '../common/Button';
import { CATEGORIES, CITIES } from '../../utils/constants';
import { dateRangeToParams } from '../../utils/dateHelpers';

const FilterSidebar = ({ filters, onFilterChange, onClearFilters, isMobile, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleCategoryToggle = (category) => {
    const newCategories = localFilters.category === category ? '' : category;
    setLocalFilters({ ...localFilters, category: newCategories });
  };

  const handleCityChange = (city) => {
    setLocalFilters({ ...localFilters, city: city === localFilters.city ? '' : city });
  };

  const handleDateChange = (dateFilter) => {
    const params = dateRangeToParams(dateFilter);

    setLocalFilters({
      ...localFilters,
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      dateFilter,
    });
  };

  const handlePriceChange = (priceFilter) => {
    let priceMin = '';
    let priceMax = '';
    let isFree = '';

    switch (priceFilter) {
      case 'free':
        isFree = 'true';
        break;
      case 'under2k':
        priceMax = '2000';
        break;
      case 'under5k':
        priceMax = '5000';
        break;
      case '5k+':
        priceMin = '5000';
        break;
      default:
        break;
    }

    setLocalFilters({
      ...localFilters,
      isFree,
      priceMin,
      priceMax,
      priceFilter,
    });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleClearAll = () => {
    const clearedFilters = {
      category: '',
      city: '',
      dateFrom: '',
      dateTo: '',
      dateFilter: '',
      isFree: '',
      priceMin: '',
      priceMax: '',
      priceFilter: '',
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    if (isMobile && onClose) {
      onClose();
    }
  };
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${isMobile ? 'p-6' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-ink-black">Filters</h2>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-teal" />
            <h3 className="font-body text-sm font-semibold text-ink-black">Date</h3>
          </div>
          <div className="space-y-2">
            {['today', 'weekend', 'week', 'month'].map((option) => (
              <button
                key={option}
                onClick={() => handleDateChange(option)}
                className={`w-full px-3 py-2 text-left rounded-md font-body text-sm transition-colors ${localFilters.dateFilter === option
                    ? 'bg-teal/10 text-teal font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {option === 'today' && 'Today'}
                {option === 'weekend' && 'This Weekend'}
                {option === 'week' && 'This Week'}
                {option === 'month' && 'This Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Banknote className="w-4 h-4 text-teal" />
            <h3 className="font-body text-sm font-semibold text-ink-black">Price</h3>
          </div>
          <div className="space-y-2">
            {['free', 'under2k', 'under5k', '5k+'].map((option) => (
              <button
                key={option}
                onClick={() => handlePriceChange(option)}
                className={`w-full px-3 py-2 text-left rounded-md font-body text-sm transition-colors ${localFilters.priceFilter === option
                    ? 'bg-teal/10 text-teal font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {option === 'free' && 'Free'}
                {option === 'under2k' && 'Under 2,000 FCFA'}
                {option === 'under5k' && 'Under 5,000 FCFA'}
                {option === '5k+' && '5,000+ FCFA'}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-teal" />
            <h3 className="font-body text-sm font-semibold text-ink-black">City</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCityChange(city.id)}
                className={`w-full px-3 py-2 text-left rounded-md font-body text-sm transition-colors ${localFilters.city === city.id
                    ? 'bg-teal/10 text-teal font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {city.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-teal" />
            <h3 className="font-body text-sm font-semibold text-ink-black">Category</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`w-full px-3 py-2 text-left rounded-md font-body text-sm transition-colors ${localFilters.category === category.id
                    ? 'bg-teal/10 text-teal font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-6 pt-6 border-t border-gray-200">
        <Button variant="primary" size="lg" fullWidth onClick={handleApplyFilters}>
          Apply Filters
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={handleClearAll}>
          Clear All
        </Button>
      </div>
    </div >
  );
};
FilterSidebar.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  isMobile: PropTypes.bool,
  onClose: PropTypes.func,
};
export default FilterSidebar;