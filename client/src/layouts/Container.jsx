import PropTypes from 'prop-types';

const Container = ({ children, className = '' }) => {
    return (
        <div className={`max-w-screen-xl mx-auto px-5 md:px-10 ${className}`}>
            {children}
        </div>
    );
};

Container.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export default Container;
