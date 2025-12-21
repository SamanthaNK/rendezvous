import PropTypes from 'prop-types';

function Input({
    label,
    placeholder,
    value,
    onChange,
    error,
    disabled,
    type = 'text',
    name,
    id,
    required = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    inputClassName = '',
}) {
    const inputId = id || name;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block font-body text-sm font-medium text-ink-black mb-2"
                >
                    {label}
                    {required && (
                        <span className="text-error ml-1" aria-label="required">
                            *
                        </span>
                    )}
                </label>
            )}

            <div className="relative">
                {Icon && iconPosition === 'left' && (
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                )}

                <input
                    id={inputId}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    aria-required={required}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    className={`
            w-full px-4 py-3 font-body text-base
            border-[1.5px] rounded-md
            ${error ? 'border-error' : 'border-gray-200'}
            ${Icon && iconPosition === 'left' ? 'pl-11' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-11' : ''}
            focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10
            disabled:bg-gray-100 disabled:cursor-not-allowed
            placeholder:text-gray-400
            transition-all duration-200
            ${inputClassName}
          `}
                />

                {Icon && iconPosition === 'right' && (
                    <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                )}
            </div>

            {error && (
                <p
                    id={`${inputId}-error`}
                    className="mt-2 text-sm text-error font-body"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

Input.propTypes = {
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    type: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    required: PropTypes.bool,
    icon: PropTypes.elementType,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    className: PropTypes.string,
    inputClassName: PropTypes.string,
};

export default Input;