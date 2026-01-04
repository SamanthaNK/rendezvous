import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const AI_TIMEOUT = 5000; // 5 second timeout

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

// Extract category using zero-shot classification
const extractCategory = async (query) => {
    try {
        console.log('[AI] Extracting category from:', query);

        const result = await withTimeout(
            hf.zeroShotClassification({
                model: 'facebook/bart-large-mnli',
                inputs: query,
                parameters: {
                    candidate_labels: CATEGORIES,
                    multi_label: false,
                },
            })
        );

        console.log('[AI] Category extraction result:', result);

        // Return category if confidence is above threshold
        if (result.scores[0] > 0.3) {
            return result.labels[0];
        }

        return null;
    } catch (error) {
        console.error('[AI] Category extraction failed:', error.message);
        return null;
    }
};

// Extract location from query
const extractLocation = (query) => {
    try {
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
    } catch (error) {
        console.error('[AI] Location extraction failed:', error.message);
        return null;
    }
};

// Extract price/budget information
const extractBudget = (query) => {
    try {
        console.log('[AI] Extracting budget from:', query);

        const queryLower = query.toLowerCase();

        // Check for free keywords in English and French
        if (
            queryLower.includes('free') ||
            queryLower.includes('gratuit') ||
            queryLower.includes('gratis') ||
            queryLower.includes('libre')
        ) {
            console.log('[AI] Budget: free');
            return { isFree: true, maxPrice: null };
        }

        // Extract numeric price with FCFA and common abbreviations
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
                // If using "k" notation, multiply by 1000
                if (query.match(/(\d+)k/i)) {
                    price *= 1000;
                }
                console.log('[AI] Budget: max', price);
                return { isFree: false, maxPrice: price };
            }
        }

        return { isFree: false, maxPrice: null };
    } catch (error) {
        console.error('[AI] Budget extraction failed:', error.message);
        return { isFree: false, maxPrice: null };
    }
};

// Extract timeframe from query
const extractTimeframe = (query) => {
    try {
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
    } catch (error) {
        console.error('[AI] Timeframe extraction failed:', error.message);
        return { dateFrom: null, dateTo: null, filter: null };
    }
};

// Extract mood/vibe keywords
const extractMood = (query) => {
    try {
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
    } catch (error) {
        console.error('[AI] Mood extraction failed:', error.message);
        return null;
    }
};

// Fallback keyword-based search when AI fails
const fallbackSearch = (query) => {
    console.log('[AI] Using fallback keyword search');

    const normalizedQuery = normalizeText(query);

    const categoryKeywords = {
        'Music & Concerts': ['music', 'concert', 'band', 'dj', 'musique', 'orchestre'],
        'Arts & Culture': ['art', 'culture', 'exhibition', 'gallery', 'museum', 'musee', 'exposition'],
        'Sports & Fitness': ['sport', 'fitness', 'gym', 'workout', 'yoga', 'entrainement'],
        'Food & Drink': ['food', 'restaurant', 'cuisine', 'drink', 'wine', 'nourriture', 'boisson'],
        'Business & Networking': ['business', 'networking', 'startup', 'entrepreneur', 'affaires', 'reseautage'],
        Technology: ['tech', 'technology', 'coding', 'software', 'digital', 'technologie', 'numerique'],
        'Health & Wellness': ['health', 'wellness', 'meditation', 'sante', 'bien-etre'],
        'Community & Charity': ['charity', 'volunteer', 'community', 'charite', 'communaute', 'benevolat'],
        Entertainment: ['entertainment', 'comedy', 'show', 'theatre', 'divertissement', 'spectacle'],
        'Education & Workshops': ['workshop', 'class', 'training', 'education', 'formation', 'cours'],
        'Family & Kids': ['family', 'kids', 'children', 'famille', 'enfants'],
        Nightlife: ['nightlife', 'club', 'bar', 'party', 'night', 'soiree', 'nuit'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            const normalizedKeyword = normalizeText(keyword);
            if (normalizedQuery.includes(normalizedKeyword)) {
                console.log('[AI] Fallback category found:', category);
                return category;
            }
        }
    }

    return null;
};

// Main query parsing function
export const parseQuery = async (query) => {
    console.log('\nAI Query Parsing Started');
    console.log('[AI] Original query:', query);

    try {
        const [category, location, budget, timeframe, mood] = await Promise.all([
            extractCategory(query).catch(() => null),
            Promise.resolve(extractLocation(query)),
            Promise.resolve(extractBudget(query)),
            Promise.resolve(extractTimeframe(query)),
            Promise.resolve(extractMood(query)),
        ]);

        // If category extraction failed, use fallback
        const finalCategory = category || fallbackSearch(query);

        const result = {
            category: finalCategory,
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
            usedFallback: !category,
        };

        console.log('[AI] Parsed result:', JSON.stringify(result, null, 2));
        console.log('AI Query Parsing Completed\n');

        return result;
    } catch (error) {
        console.error('[AI] Query parsing failed:', error.message);
        console.log('[AI] Using keyword fallback only');

        const result = {
            category: fallbackSearch(query),
            location: extractLocation(query),
            budget: extractBudget(query),
            timeframe: extractTimeframe(query),
            mood: extractMood(query),
            originalQuery: query,
            usedFallback: true,
        };

        console.log('[AI] Fallback result:', JSON.stringify(result, null, 2));
        console.log('AI Query Parsing Completed (Fallback)\n');

        return result;
    }
};

// Generate event embeddings for recommendations (using sentence transformers)
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

// Suggest category for event creation
export const suggestCategory = async (description) => {
    try {
        console.log('[AI] Suggesting category for description');

        const result = await withTimeout(
            hf.zeroShotClassification({
                model: 'facebook/bart-large-mnli',
                inputs: description,
                parameters: {
                    candidate_labels: CATEGORIES,
                    multi_label: false,
                },
            })
        );

        console.log('[AI] Category suggestion:', result.labels[0], 'confidence:', result.scores[0]);

        return {
            category: result.labels[0],
            confidence: result.scores[0],
            alternatives: result.labels.slice(1, 3), // Top 2 alternatives
        };
    } catch (error) {
        console.error('[AI] Category suggestion failed:', error.message);
        return null;
    }
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

        // Calculate cosine similarity
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

// Detect potentially fraudulent events
export const detectFraud = async (eventData) => {
    try {
        console.log('[AI] Analyzing event for fraud indicators');

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

        // Check for suspicious keywords
        for (const keyword of suspiciousKeywords) {
            if (text.includes(keyword)) {
                flagCount++;
                reasons.push(`Contains suspicious keyword: "${keyword}"`);
            }
        }

        // Check for unrealistic pricing
        if (eventData.price > 50000 && !eventData.organizer?.isVerified) {
            flagCount++;
            reasons.push('High price from unverified organizer');
        }

        // Check for missing critical information
        if (!eventData.contactInfo?.phone || !eventData.contactInfo?.email) {
            flagCount++;
            reasons.push('Missing contact information');
        }

        // Check for vague location
        if (eventData.location?.address?.length < 10) {
            flagCount++;
            reasons.push('Vague or missing location details');
        }

        const isSuspicious = flagCount >= 2;
        const confidence = Math.min(flagCount / 5, 1); // 0-1 scale

        console.log('[AI] Fraud detection result:', {
            isSuspicious,
            confidence,
            flagCount,
        });

        return {
            isSuspicious,
            confidence,
            flagCount,
            reasons,
        };
    } catch (error) {
        console.error('[AI] Fraud detection failed:', error.message);
        return {
            isSuspicious: false,
            confidence: 0,
            flagCount: 0,
            reasons: [],
        };
    }
};

export default {
    parseQuery,
    generateEventEmbedding,
    suggestCategory,
    calculateSimilarity,
    detectFraud,
};