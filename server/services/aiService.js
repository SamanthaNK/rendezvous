import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const AI_TIMEOUT = 10000;

const CATEGORIES = [
    'Music & Concerts',
    'Arts & Culture',
    'Sports & Fitness',
    'Food & Drink',
    'Business & Networking',
    'Technology',
    'Health & Wellness',
    'Community & Charity',
    'Entertainment',
    'Education & Workshops',
    'Family & Kids',
    'Nightlife',
];

const CAMEROON_CITIES = [
    'Douala',
    'Yaoundé',
    'Yaounde',
    'Garoua',
    'Bamenda',
    'Bafoussam',
    'Maroua',
    'Ngaoundéré',
    'Ngaoundere',
    'Bertoua',
    'Limbe',
    'Buea',
    'Kumba',
    'Ebolowa',
    'Kribi',
];

const normalizeText = (text) => {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
};

const withTimeout = (promise, timeoutMs = AI_TIMEOUT) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI request timeout')), timeoutMs)
        ),
    ]);
};

// Extract category using keyword matching (no AI calls)
const extractCategory = (query) => {
    console.log('[AI] Extracting category from:', query);

    const normalizedQuery = normalizeText(query);

    const categoryKeywords = {
        'Music & Concerts': ['music', 'concert', 'band', 'dj', 'musique', 'orchestre', 'festival'],
        'Arts & Culture': ['art', 'culture', 'exhibition', 'gallery', 'museum', 'musee', 'exposition', 'painting', 'sculpture'],
        'Sports & Fitness': ['sport', 'fitness', 'gym', 'workout', 'yoga', 'entrainement', 'match', 'game'],
        'Food & Drink': ['food', 'restaurant', 'cuisine', 'drink', 'wine', 'nourriture', 'boisson', 'tasting', 'dinner'],
        'Business & Networking': ['business', 'networking', 'startup', 'entrepreneur', 'affaires', 'reseautage', 'conference', 'seminar'],
        Technology: ['tech', 'technology', 'coding', 'software', 'digital', 'technologie', 'numerique', 'programming', 'developer'],
        'Health & Wellness': ['health', 'wellness', 'meditation', 'sante', 'bien-etre', 'therapy', 'mindfulness'],
        'Community & Charity': ['charity', 'volunteer', 'community', 'charite', 'communaute', 'benevolat', 'fundraiser'],
        Entertainment: ['entertainment', 'comedy', 'show', 'theatre', 'divertissement', 'spectacle', 'performance'],
        'Education & Workshops': ['workshop', 'class', 'training', 'education', 'formation', 'cours', 'seminar', 'lecture'],
        'Family & Kids': ['family', 'kids', 'children', 'famille', 'enfants', 'child', 'parent'],
        Nightlife: ['nightlife', 'club', 'bar', 'party', 'night', 'soiree', 'nuit', 'dancing'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            const normalizedKeyword = normalizeText(keyword);
            if (normalizedQuery.includes(normalizedKeyword)) {
                console.log('[AI] Category found:', category);
                return category;
            }
        }
    }

    console.log('[AI] No category found');
    return null;
};

const extractLocation = (query) => {
    console.log('[AI] Extracting location from:', query);

    const normalizedQuery = normalizeText(query);

    for (const city of CAMEROON_CITIES) {
        const normalizedCity = normalizeText(city);
        if (normalizedQuery.includes(normalizedCity)) {
            console.log('[AI] Location found:', city);
            return city;
        }
    }

    return null;
};

const extractBudget = (query) => {
    console.log('[AI] Extracting budget from:', query);

    const queryLower = query.toLowerCase();

    if (
        queryLower.includes('free') ||
        queryLower.includes('gratuit') ||
        queryLower.includes('gratis') ||
        queryLower.includes('libre')
    ) {
        console.log('[AI] Budget: free');
        return { isFree: true, maxPrice: null };
    }

    const pricePatterns = [
        /(\d+)\s*(?:fcfa|cfa|f\b)/i,
        /under\s+(\d+)/i,
        /moins\s+de\s+(\d+)/i,
        /below\s+(\d+)/i,
        /max\s+(\d+)/i,
        /(\d+)k/i,
    ];

    for (const pattern of pricePatterns) {
        const match = query.match(pattern);
        if (match) {
            let price = parseInt(match[1]);
            if (query.match(/(\d+)k/i)) {
                price *= 1000;
            }
            console.log('[AI] Budget: max', price);
            return { isFree: false, maxPrice: price };
        }
    }

    return { isFree: false, maxPrice: null };
};

const extractTimeframe = (query) => {
    console.log('[AI] Extracting timeframe from:', query);

    const normalizedQuery = normalizeText(query);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
        normalizedQuery.includes('tonight') ||
        normalizedQuery.includes('ce soir') ||
        normalizedQuery.includes('today') ||
        normalizedQuery.includes('aujourd') ||
        normalizedQuery.includes('aujourdhui')
    ) {
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        console.log('[AI] Timeframe: today');
        return { dateFrom: today, dateTo: endOfDay, filter: 'today' };
    }

    if (
        normalizedQuery.includes('tomorrow') ||
        normalizedQuery.includes('demain')
    ) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        console.log('[AI] Timeframe: tomorrow');
        return { dateFrom: tomorrow, dateTo: endOfTomorrow, filter: 'tomorrow' };
    }

    if (
        normalizedQuery.includes('weekend') ||
        normalizedQuery.includes('this weekend') ||
        normalizedQuery.includes('ce weekend') ||
        normalizedQuery.includes('fin de semaine')
    ) {
        const dayOfWeek = today.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        sunday.setHours(23, 59, 59, 999);
        console.log('[AI] Timeframe: weekend');
        return { dateFrom: saturday, dateTo: sunday, filter: 'weekend' };
    }

    if (
        normalizedQuery.includes('this week') ||
        normalizedQuery.includes('cette semaine')
    ) {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        console.log('[AI] Timeframe: this week');
        return { dateFrom: today, dateTo: nextWeek, filter: 'week' };
    }

    if (
        normalizedQuery.includes('this month') ||
        normalizedQuery.includes('ce mois') ||
        normalizedQuery.includes('ce mois-ci')
    ) {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        console.log('[AI] Timeframe: this month');
        return { dateFrom: today, dateTo: nextMonth, filter: 'month' };
    }

    return { dateFrom: null, dateTo: null, filter: null };
};

const extractMood = (query) => {
    console.log('[AI] Extracting mood from:', query);

    const normalizedQuery = normalizeText(query);

    const moodKeywords = {
        relaxing: ['calm', 'peaceful', 'relaxing', 'chill', 'tranquil', 'calme', 'paisible', 'reposant'],
        energetic: ['energetic', 'exciting', 'fun', 'party', 'lively', 'energique', 'excitant', 'anime'],
        educational: ['educational', 'learning', 'workshop', 'educatif', 'formation', 'apprentissage'],
        social: ['social', 'networking', 'meetup', 'reseautage', 'rencontre'],
        family: ['family', 'kids', 'children', 'famille', 'enfants'],
        romantic: ['romantic', 'date', 'couples', 'romantique', 'amoureux'],
        professional: ['professional', 'business', 'corporate', 'professionnel', 'entreprise'],
    };

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
        for (const keyword of keywords) {
            const normalizedKeyword = normalizeText(keyword);
            if (normalizedQuery.includes(normalizedKeyword)) {
                console.log('[AI] Mood found:', mood);
                return mood;
            }
        }
    }

    return null;
};

// Main query parsing function (no AI classification calls)
export const parseQuery = async (query) => {
    console.log('\n=== Query Parsing Started ===');
    console.log('[Query] Original query:', query);

    const category = extractCategory(query);
    const location = extractLocation(query);
    const budget = extractBudget(query);
    const timeframe = extractTimeframe(query);
    const mood = extractMood(query);

    const result = {
        category,
        location,
        budget: {
            isFree: budget.isFree,
            maxPrice: budget.maxPrice,
        },
        timeframe: {
            dateFrom: timeframe.dateFrom,
            dateTo: timeframe.dateTo,
            filter: timeframe.filter,
        },
        mood,
        originalQuery: query,
        usedFallback: false,
    };

    console.log('[Query] Parsed result:', JSON.stringify(result, null, 2));
    console.log('=== Query Parsing Completed ===\n');

    return result;
};

// Generate event embeddings for recommendations (ONLY AI feature we use)
export const generateEventEmbedding = async (eventText) => {
    try {
        console.log('[AI] Generating embedding for:', eventText.substring(0, 50) + '...');

        const result = await withTimeout(
            hf.featureExtraction({
                model: 'sentence-transformers/all-MiniLM-L6-v2',
                inputs: eventText,
            })
        );

        console.log('[AI] Embedding generated successfully');
        return result;
    } catch (error) {
        console.error('[AI] Embedding generation failed:', error.message);
        return null;
    }
};

// Suggest category for event creation (keyword-based, no AI)
export const suggestCategory = (description) => {
    console.log('[Category] Suggesting category for description');

    const normalizedDesc = normalizeText(description);

    const categoryKeywords = {
        'Music & Concerts': ['music', 'concert', 'band', 'dj', 'singer', 'musique', 'orchestre'],
        'Arts & Culture': ['art', 'culture', 'exhibition', 'gallery', 'museum', 'painting'],
        'Sports & Fitness': ['sport', 'fitness', 'gym', 'workout', 'yoga', 'match'],
        'Food & Drink': ['food', 'restaurant', 'cuisine', 'drink', 'wine', 'tasting'],
        'Business & Networking': ['business', 'networking', 'startup', 'entrepreneur', 'conference'],
        Technology: ['tech', 'technology', 'coding', 'software', 'digital', 'programming'],
        'Health & Wellness': ['health', 'wellness', 'meditation', 'therapy', 'mindfulness'],
        'Community & Charity': ['charity', 'volunteer', 'community', 'fundraiser'],
        Entertainment: ['entertainment', 'comedy', 'show', 'theatre', 'performance'],
        'Education & Workshops': ['workshop', 'class', 'training', 'education', 'seminar'],
        'Family & Kids': ['family', 'kids', 'children', 'child', 'parent'],
        Nightlife: ['nightlife', 'club', 'bar', 'party', 'dancing'],
    };

    let bestMatch = null;
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        let matches = 0;
        for (const keyword of keywords) {
            if (normalizedDesc.includes(normalizeText(keyword))) {
                matches++;
            }
        }
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = category;
        }
    }

    console.log('[Category] Suggested category:', bestMatch, 'matches:', maxMatches);

    return {
        category: bestMatch || 'Entertainment',
        confidence: maxMatches > 0 ? Math.min(maxMatches / 3, 1) : 0.1,
        alternatives: [],
    };
};

// Calculate similarity between two text strings
export const calculateSimilarity = async (text1, text2) => {
    try {
        console.log('[AI] Calculating text similarity');

        const [embedding1, embedding2] = await Promise.all([
            generateEventEmbedding(text1),
            generateEventEmbedding(text2),
        ]);

        if (!embedding1 || !embedding2) {
            return null;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

        console.log('[AI] Similarity score:', similarity);
        return similarity;
    } catch (error) {
        console.error('[AI] Similarity calculation failed:', error.message);
        return null;
    }
};

// Detect potentially fraudulent events (keyword-based, no AI)
export const detectFraud = (eventData) => {
    console.log('[Fraud] Analyzing event for fraud indicators');

    const suspiciousKeywords = [
        'guaranteed',
        'must pay now',
        'limited time',
        'act fast',
        'urgent',
        'too good to be true',
        'garanti',
        'payer maintenant',
        'temps limite',
        'agir vite',
    ];

    const text = `${eventData.title} ${eventData.description}`.toLowerCase();
    let flagCount = 0;
    const reasons = [];

    for (const keyword of suspiciousKeywords) {
        if (text.includes(keyword)) {
            flagCount++;
            reasons.push(`Contains suspicious keyword: "${keyword}"`);
        }
    }

    if (eventData.price > 50000 && !eventData.organizer?.isVerified) {
        flagCount++;
        reasons.push('High price from unverified organizer');
    }

    if (!eventData.contactInfo?.phone || !eventData.contactInfo?.email) {
        flagCount++;
        reasons.push('Missing contact information');
    }

    if (eventData.location?.address?.length < 10) {
        flagCount++;
        reasons.push('Vague or missing location details');
    }

    const isSuspicious = flagCount >= 2;
    const confidence = Math.min(flagCount / 5, 1);

    console.log('[Fraud] Detection result:', { isSuspicious, confidence, flagCount });

    return {
        isSuspicious,
        confidence,
        flagCount,
        reasons,
    };
};

export default {
    parseQuery,
    generateEventEmbedding,
    suggestCategory,
    calculateSimilarity,
    detectFraud,
};