import PropTypes from 'prop-types';

const Spinner = ({ size = 'md', color = 'teal', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    teal: 'border-gray-200 border-t-teal',
    white: 'border-white/30 border-t-white',
    'ink-black': 'border-gray-200 border-t-ink-black',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        rounded-full animate-spin-slow
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['teal', 'white', 'ink-black']),
  className: PropTypes.string,
};

export default Spinner;
