import PropTypes from 'prop-types';

const Skeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-skeleton rounded';

  const variantClasses = {
    text: 'h-4',
    title: 'h-6',
    avatar: 'rounded-full',
    thumbnail: 'h-48',
    button: 'h-10',
  };

  const Component = () => (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${className}
      `}
      style={{
        width: width || '100%',
        height: height || undefined,
      }}
      aria-hidden="true"
    />
  );

  if (count === 1) {
    return <Component />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Component key={index} />
      ))}
    </>
  );
};

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'title', 'avatar', 'thumbnail', 'button']),
  width: PropTypes.string,
  height: PropTypes.string,
  count: PropTypes.number,
  className: PropTypes.string,
};

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-4">
      <Skeleton variant="thumbnail" className="mb-4" />
      <Skeleton width="80px" height="24px" className="rounded-full mb-3" />
      <Skeleton variant="title" className="mb-3" width="75%" />
      <div className="space-y-2 mb-4">
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="65%" />
      </div>
    </div>
  );
};

export { Skeleton, SkeletonCard };
