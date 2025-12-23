import PropTypes from 'prop-types';

const IconButton = ({
  icon: Icon,
  onClick,
  ariaLabel,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    default: `
      bg-white border-[1.5px] border-gray-200 text-gray-600
      hover:border-teal hover:bg-teal/5 hover:text-teal
      active:scale-95
      disabled:bg-gray-100 disabled:cursor-not-allowed
    `,
    ghost: `
      bg-transparent text-gray-600
      hover:bg-gray-100 hover:text-ink-black
      active:bg-gray-200
      disabled:text-gray-400 disabled:cursor-not-allowed
    `,
    primary: `
      bg-teal text-white
      hover:bg-teal/90 hover:-translate-y-0.5
      active:translate-y-0
      disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        flex items-center justify-center rounded-md
        transition-all duration-200 ease-in-out
        ${className}
      `}
    >
      <Icon className={iconSizeClasses[size]} />
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  onClick: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'ghost', 'primary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default IconButton;
