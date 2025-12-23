import PropTypes from 'prop-types';
import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../common/Button';

const FilterSidebar = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  categories = [],
}) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    date: true,
    price: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (category, checked) => {
    const currentCategories = filters.categories || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category);

    onFiltersChange({
      ...filters,
      categories: newCategories,
    });
  };

  const handleDateChange = (dateRange) => {
    onFiltersChange({
      ...filters,
      dateRange,
    });
  };

  const handlePriceChange = (priceRange) => {
    onFiltersChange({
      ...filters,
      priceRange,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      dateRange: 'all',
      priceRange: 'all',
    });
  };

  const hasActiveFilters = (filters.categories?.length > 0) ||
                            (filters.dateRange && filters.dateRange !== 'all') ||
                            (filters.priceRange && filters.priceRange !== 'all');

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
                fixed lg:static inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="font-heading text-lg font-bold text-ink-black">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-gray-600">Active filters</span>
                <button
                  onClick={clearAllFilters}
                  className="font-body text-sm text-teal hover:text-teal/80 transition-colors"
                >
                                    Clear all
                </button>
              </div>
            )}

            {/* Categories */}
            <div>
              <button
                onClick={() => toggleSection('categories')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <h3 className="font-heading text-base font-semibold text-ink-black">Categories</h3>
                {expandedSections.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedSections.categories && (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.categories?.includes(category) || false}
                        onChange={(e) => handleCategoryChange(category, e.target.checked)}
                        className="w-4 h-4 text-teal border-gray-300 rounded focus:ring-teal"
                      />
                      <span className="font-body text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div>
              <button
                onClick={() => toggleSection('date')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <h3 className="font-heading text-base font-semibold text-ink-black">Date</h3>
                {expandedSections.date ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedSections.date && (
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All dates' },
                    { value: 'today', label: 'Today' },
                    { value: 'tomorrow', label: 'Tomorrow' },
                    { value: 'weekend', label: 'This weekend' },
                    { value: 'week', label: 'This week' },
                    { value: 'month', label: 'This month' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dateRange"
                        value={option.value}
                        checked={filters.dateRange === option.value}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-4 h-4 text-teal border-gray-300 focus:ring-teal"
                      />
                      <span className="font-body text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div>
              <button
                onClick={() => toggleSection('price')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <h3 className="font-heading text-base font-semibold text-ink-black">Price</h3>
                {expandedSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedSections.price && (
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All prices' },
                    { value: 'free', label: 'Free' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'under25', label: 'Under 5000 XAF' },
                    { value: '25to50', label: '5000 - 10000 XAF' },
                    { value: 'over50', label: 'Over 10000 XAF' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priceRange"
                        value={option.value}
                        checked={filters.priceRange === option.value}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-4 h-4 text-teal border-gray-300 focus:ring-teal"
                      />
                      <span className="font-body text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 lg:hidden">
            <Button
              onClick={onClose}
              variant="primary"
              fullWidth
            >
                            Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

FilterSidebar.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  filters: PropTypes.shape({
    categories: PropTypes.arrayOf(PropTypes.string),
    dateRange: PropTypes.string,
    priceRange: PropTypes.string,
  }),
  onFiltersChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string),
};

export default FilterSidebar;
