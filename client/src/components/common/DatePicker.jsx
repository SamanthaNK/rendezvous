import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Calendar } from 'lucide-react';

const DatePicker = forwardRef(
    (
        {
            label,
            value,
            onChange,
            error,
            disabled,
            required = false,
            min,
            max,
            placeholder = 'Select date',
            className = '',
            ...rest
        },
        ref
    ) => {
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
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

                    <input
                        ref={ref}
                        type="date"
                        value={value}
                        onChange={onChange}
                        min={min}
                        max={max}
                        disabled={disabled}
                        required={required}
                        placeholder={placeholder}
                        className={`
              w-full pl-11 pr-4 py-3 font-body text-base
              border-[1.5px] rounded-md
              ${error ? 'border-error' : 'border-gray-200'}
              focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-all duration-200
              ${!value ? 'text-gray-400' : 'text-ink-black'}
            `}
                        {...rest}
                    />
                </div>

                {error && (
                    <p className="mt-2 text-sm text-error font-body" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

DatePicker.displayName = 'DatePicker';

DatePicker.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    min: PropTypes.string,
    max: PropTypes.string,
    placeholder: PropTypes.string,
    className: PropTypes.string,
};

export default DatePicker;