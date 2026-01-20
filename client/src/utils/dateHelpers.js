export const formatDate = (date, format = 'short') => {
    const d = new Date(date);

    if (format === 'short') {
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    if (format === 'long') {
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    if (format === 'time') {
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }

    return d.toLocaleDateString('en-US');
};

export const isToday = (date) => {
    const eventDate = new Date(date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
};

export const isTomorrow = (date) => {
    const eventDate = new Date(date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return eventDate.toDateString() === tomorrow.toDateString();
};

export const isThisWeekend = (date) => {
    const eventDate = new Date(date);
    const dayOfWeek = eventDate.getDay();
    const today = new Date();

    if (dayOfWeek !== 6 && dayOfWeek !== 0) return false;

    const thisWeekend = getWeekendDates();
    return eventDate >= thisWeekend.start && eventDate <= thisWeekend.end;
};

export const getRelativeDate = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return formatDate(date, 'short');
};

// Get date range for filtering
export const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
        case 'today': {
            const end = new Date(today);
            end.setHours(23, 59, 59, 999);
            return { start: today, end };
        }

        case 'tomorrow': {
            const start = new Date(today);
            start.setDate(today.getDate() + 1);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }

        case 'weekend': {
            const { start, end } = getWeekendDates();
            return { start, end };
        }

        case 'week': {
            const end = new Date(today);
            end.setDate(today.getDate() + 7);
            end.setHours(23, 59, 59, 999);
            return { start: today, end };
        }

        case 'month': {
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            return { start: today, end };
        }

        default:
            return null;
    }
};

// Helper to get this weekend's dates
const getWeekendDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);

    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);

    return { start: saturday, end: sunday };
};

// Convert date range to filter params for API
export const dateRangeToParams = (filter) => {
    const range = getDateRange(filter);
    if (!range) return {};

    return {
        dateFrom: range.start.toISOString().split('T')[0],
        dateTo: range.end.toISOString().split('T')[0],
    };
};