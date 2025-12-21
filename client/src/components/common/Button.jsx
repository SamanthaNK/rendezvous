import PropTypes from 'prop-types';

function Button({
    children,
    onClick,
    disabled,
    type = 'button',
    variant = 'primary',
    size = 'md',
    className = '',
    fullWidth = false,
    icon: Icon,
    iconPosition = 'left',
    ariaLabel,
}) {
    const baseClasses = 'font-body font-semibold rounded-md transition-all duration-200 inline-flex items-center justify-center gap-2';

    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-base',
    };

    const variantClasses = {
        primary: `
      bg-teal text-white
      hover:bg-teal/90 hover:-translate-y-0.5 hover:shadow-md
      active:translate-y-0 active:shadow-sm
      disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none
    `,
        secondary: `
      bg-transparent text-ink-black border-[1.5px] border-gray-300
      hover:border-teal hover:text-teal
      active:scale-95
      disabled:bg-gray-100 disabled:cursor-not-allowed
    `,
        ghost: `
      bg-transparent text-teal
      hover:bg-teal/5
      active:bg-teal/10
      disabled:text-gray-400 disabled:cursor-not-allowed
    `,
        danger: `
      bg-error text-white
      hover:bg-error/90 hover:-translate-y-0.5 hover:shadow-md
      active:translate-y-0 active:shadow-sm
      disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none
    `,
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${widthClass}
        ${className}
      `}
        >
            {Icon && iconPosition === 'left' && <Icon className="w-5 h-5 flex-shrink-0" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-5 h-5 flex-shrink-0" />}
        </button>
    );
}

Button.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    fullWidth: PropTypes.bool,
    icon: PropTypes.elementType,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    ariaLabel: PropTypes.string,
};

export default Button;