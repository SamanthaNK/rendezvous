import Event from '../models/eventModel.js';
import { parseQuery } from '../services/aiService.js';

// Normalize text to remove accents for better matching
const normalizeText = (text) => {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

// Natural language search with AI parsing
export const naturalLanguageSearch = async (req, res) => {
    try {
        const { q: query, page = 1, limit = 20 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required',
            });
        }

        console.log('\nNatural Language Search');
        console.log('Query:', query);

        const parsedParams = await parseQuery(query);

        // Build MongoDB filters based on parsed parameters
        const filters = {
            status: 'published',
            isDraft: false,
        };

        if (parsedParams.category) {
            filters.categories = parsedParams.category;
        }

        if (parsedParams.location) {
            const normalizedLocation = normalizeText(parsedParams.location);
            filters['location.city'] = {
                $regex: normalizedLocation,
                $options: 'i'
            };
        }

        if (parsedParams.budget.isFree) {
            filters.isFree = true;
        } else if (parsedParams.budget.maxPrice) {
            filters.price = { $lte: parsedParams.budget.maxPrice };
        }

        if (parsedParams.timeframe.dateFrom || parsedParams.timeframe.dateTo) {
            filters.date = {};

            if (parsedParams.timeframe.dateFrom) {
                const fromDate = new Date(parsedParams.timeframe.dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                filters.date.$gte = fromDate;
            }

            if (parsedParams.timeframe.dateTo) {
                const toDate = new Date(parsedParams.timeframe.dateTo);
                toDate.setHours(23, 59, 59, 999);
                filters.date.$lte = toDate;
            }
        }

        console.log('[Search Debug] Original query:', query);
        console.log('[Search Debug] Parsed params:', JSON.stringify(parsedParams, null, 2));
        console.log('[Search Debug] MongoDB filters:', JSON.stringify(filters, null, 2));

        console.log('Applied filters:', JSON.stringify(filters, null, 2));

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const events = await Event.find(filters)
            .select('title description categories date location price isFree images metrics organizer')
            .populate('organizer', 'name email')
            .sort('-publishedAt')
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await Event.countDocuments(filters);

        console.log(`Found ${total} events matching query`);
        console.log('Search Completed\n');

        res.json({
            success: true,
            data: {
                events,
                parsedQuery: {
                    category: parsedParams.category,
                    location: parsedParams.location,
                    budget: parsedParams.budget,
                    timeframe: parsedParams.timeframe.filter,
                    mood: parsedParams.mood,
                },
                usedFallback: parsedParams.usedFallback || false,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalEvents: total,
                },
            },
            message: total > 0 ? `Found ${total} events` : 'No events found matching your search',
        });
    } catch (error) {
        console.error('Natural language search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed. Please try again.',
            error: error.message,
        });
    }
};

// Get search suggestions based on popular searches
export const getSearchSuggestions = async (req, res) => {
    try {
        const suggestions = [
            'free concerts douala this weekend',
            'networking events under 5000 FCFA',
            'calm places tonight',
            'art events under 3k',
            'tech workshops yaoundé',
            'family events this month',
            'music events buea',
            'business meetings douala',
            'food festival this weekend',
            'concerts gratuits douala ce weekend',
            'événements tech yaoundé',
            'soirées buea ce soir',
        ];

        res.json({
            success: true,
            data: { suggestions },
        });
    } catch (error) {
        console.error('Get search suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch suggestions',
            error: error.message,
        });
    }
};