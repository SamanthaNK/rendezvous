import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  multiple = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter((v) => v !== option.value)
        : [...currentValues, option.value];
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const isSelected = (option) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(option.value);
    }
    return value === option.value;
  };

  const getDisplayValue = () => {
    if (multiple) {
      const selectedOptions = options.filter((opt) =>
        Array.isArray(value) && value.includes(opt.value)
      );
      if (selectedOptions.length === 0) return placeholder;
      if (selectedOptions.length === 1) return selectedOptions[0].label;
      return `${selectedOptions.length} selected`;
    }
    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block font-body text-sm font-medium text-ink-black mb-2">
          {label}
          {required && (
            <span className="text-error ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-10 font-body text-base text-left
            border-[1.5px] rounded-md
            ${error ? 'border-error' : 'border-gray-200'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-teal'}
            focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10
            transition-all duration-200
            ${!value || (Array.isArray(value) && value.length === 0) ? 'text-gray-400' : 'text-ink-black'}
          `}
        >
          {getDisplayValue()}
        </button>

        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''
            }`}
        />

        {isOpen && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-dropdown overflow-hidden animate-dropdown-fade"
          >
            {options.length > 5 && (
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-teal"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-4 py-2.5 text-left font-body text-base
                      flex items-center justify-between gap-3
                      transition-colors
                      ${isSelected(option)
                        ? 'bg-teal/5 text-teal font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {isSelected(option) && <Check className="w-5 h-5 flex-shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-error font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  className: PropTypes.string,
};

export default Select;
