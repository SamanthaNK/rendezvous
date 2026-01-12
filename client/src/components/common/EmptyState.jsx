import PropTypes from 'prop-types';
import Button from './Button';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
    return (
        <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="font-heading text-xl font-bold text-ink-black mb-2">
                {title}
            </h3>
            <p className="font-body text-base text-gray-600 mb-6">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button variant="primary" size="lg" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

EmptyState.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    actionLabel: PropTypes.string,
    onAction: PropTypes.func,
};

export default EmptyState;