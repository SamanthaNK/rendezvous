import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const AI_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if AI service is available
export const checkAIService = async () => {
    try {
        const response = await axios.get(`${AI_SERVICE_URL}/health`, {
            timeout: 5000,
        });
        console.log('[AI Service] Health check:', response.data);
        return response.data.status === 'healthy';
    } catch (error) {
        console.error('[AI Service] Health check failed:', error.message);
        return false;
    }
};

// Extract category using keyword matching
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

// Main query parsing function
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

// Generate event embeddings using local AI service
export const generateEventEmbedding = async (eventText, retryCount = 0) => {
    try {
        console.log(`[AI Embeddings] Generating embedding (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        console.log('[AI Embeddings] Input text length:', eventText.length);

        if (!eventText || eventText.trim().length === 0) {
            throw new Error('Empty text provided for embedding generation');
        }

        const truncatedText = eventText.substring(0, 500);

        const response = await axios.post(
            `${AI_SERVICE_URL}/embed`,
            { text: truncatedText },
            { timeout: AI_TIMEOUT }
        );

        if (!response.data || !response.data.success) {
            throw new Error(response.data?.error || 'AI service returned unsuccessful response');
        }

        const embedding = response.data.embedding;

        if (!embedding || !Array.isArray(embedding)) {
            throw new Error('Invalid embedding response from AI service');
        }

        console.log('[AI Embeddings] Embedding generated successfully');
        console.log('[AI Embeddings] Embedding dimensions:', embedding.length);

        return embedding;
    } catch (error) {
        console.error(`[AI Embeddings] Generation failed (attempt ${retryCount + 1}):`, error.message);

        if (retryCount < MAX_RETRIES - 1) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            console.log(`[AI Embeddings] Retrying in ${delay}ms...`);
            await sleep(delay);
            return generateEventEmbedding(eventText, retryCount + 1);
        }

        console.error('[AI Embeddings] All retry attempts failed');
        return null;
    }
};

// Batch generate embeddings
export const generateBatchEmbeddings = async (events) => {
    console.log(`[AI Embeddings] Batch processing ${events.length} events`);

    const texts = events.map(event =>
        `${event.title} ${event.description} ${event.categories.join(' ')}`.substring(0, 500)
    );

    try {
        const response = await axios.post(
            `${AI_SERVICE_URL}/embed/batch`,
            { texts },
            { timeout: AI_TIMEOUT * 2 }
        );

        if (!response.data || !response.data.success) {
            throw new Error('Batch embedding generation failed');
        }

        const embeddings = response.data.embeddings;
        const results = events.map((event, index) => ({
            eventId: event._id,
            embedding: embeddings[index],
            success: true,
        }));

        console.log(`[AI Embeddings] Batch complete: ${results.length} embeddings generated`);

        return {
            results,
            successCount: results.length,
            failCount: 0,
            totalProcessed: events.length,
        };
    } catch (error) {
        console.error('[AI Embeddings] Batch generation failed:', error.message);

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            console.log(`[AI Embeddings] Processing event ${i + 1}/${events.length}: ${event._id}`);

            const eventText = `${event.title} ${event.description} ${event.categories.join(' ')}`;
            const embedding = await generateEventEmbedding(eventText);

            if (embedding) {
                results.push({
                    eventId: event._id,
                    embedding,
                    success: true,
                });
                successCount++;
            } else {
                results.push({
                    eventId: event._id,
                    embedding: null,
                    success: false,
                });
                failCount++;
            }

            await sleep(200);
        }

        console.log(`[AI Embeddings] Batch complete: ${successCount} success, ${failCount} failed`);

        return {
            results,
            successCount,
            failCount,
            totalProcessed: events.length,
        };
    }
};

// Suggest category using keyword matching
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

// Calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Find similar events
export const findSimilarEvents = (eventEmbedding, otherEvents, topK = 5) => {
    console.log(`[AI Similarity] Finding top ${topK} similar events from ${otherEvents.length} candidates`);

    if (!eventEmbedding || !Array.isArray(eventEmbedding)) {
        console.error('[AI Similarity] Invalid event embedding');
        return [];
    }

    const similarities = otherEvents
        .filter(event => event.embedding && Array.isArray(event.embedding))
        .map(event => ({
            event,
            similarity: cosineSimilarity(eventEmbedding, event.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

    console.log('[AI Similarity] Top similarities:', similarities.map(s => s.similarity.toFixed(3)));

    return similarities;
};

// Calculate similarity using local AI service
export const calculateSimilarity = async (text1, text2) => {
    try {
        console.log('[AI Similarity] Calculating text similarity via local service');

        const response = await axios.post(
            `${AI_SERVICE_URL}/similarity`,
            { text1, text2 },
            { timeout: AI_TIMEOUT }
        );

        if (!response.data || !response.data.success) {
            throw new Error('Similarity calculation failed');
        }

        const similarity = response.data.similarity;

        console.log('[AI Similarity] Similarity score:', similarity.toFixed(3));
        return similarity;
    } catch (error) {
        console.error('[AI Similarity] Calculation failed:', error.message);
        return null;
    }
};

// Detect fraud
export const detectFraud = (eventData) => {
    console.log('[Fraud Detection] Analyzing event for fraud indicators');

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

    console.log('[Fraud Detection] Result:', { isSuspicious, confidence, flagCount });

    return {
        isSuspicious,
        confidence,
        flagCount,
        reasons,
    };
};

export default {
    checkAIService,
    parseQuery,
    generateEventEmbedding,
    generateBatchEmbeddings,
    suggestCategory,
    findSimilarEvents,
    calculateSimilarity,
    detectFraud,
};