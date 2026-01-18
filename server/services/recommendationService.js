import User from '../models/userModel.js';
import Event from '../models/eventModel.js';

// Calculate cosine similarity between two vectors
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

// Calculate Jaccard similarity between two sets
const jaccardSimilarity = (setA, setB) => {
    const intersection = setA.filter(item => setB.includes(item));
    const union = [...new Set([...setA, ...setB])];

    if (union.length === 0) {
        return 0;
    }

    return intersection.length / union.length;
};

// Content-based filtering: match user interests with event categories
const contentBasedScore = (userInterests, userCity, event) => {
    let score = 0;

    // Interest matching (70% weight)
    const categoryMatch = event.categories.some(cat => userInterests.includes(cat));
    if (categoryMatch) {
        score += 0.7;
    }

    // Location matching (30% weight)
    if (event.location?.city === userCity) {
        score += 0.3;
    }

    return score;
};

// Collaborative filtering: find similar users and recommend their liked events
const collaborativeFilteringScore = async (userId, eventId, userInteractions) => {
    try {
        const currentUser = await User.findById(userId)
            .select('savedEvents interestedEvents')
            .lean();

        if (!currentUser) {
            return { score: 0, similarUsers: [] };
        }

        const currentUserEvents = [
            ...currentUser.savedEvents.map(id => id.toString()),
            ...currentUser.interestedEvents.map(id => id.toString())
        ];

        if (currentUserEvents.length === 0) {
            return { score: 0, similarUsers: [] };
        }

        // Find users who interacted with similar events
        const similarUsers = await User.find({
            _id: { $ne: userId },
            $or: [
                { savedEvents: { $in: currentUserEvents } },
                { interestedEvents: { $in: currentUserEvents } }
            ]
        })
            .select('savedEvents interestedEvents')
            .limit(50)
            .lean();

        if (similarUsers.length === 0) {
            return { score: 0, similarUsers: [] };
        }

        // Calculate similarity with each user
        const userSimilarities = similarUsers.map(user => {
            const otherUserEvents = [
                ...user.savedEvents.map(id => id.toString()),
                ...user.interestedEvents.map(id => id.toString())
            ];

            const similarity = jaccardSimilarity(currentUserEvents, otherUserEvents);

            return {
                userId: user._id,
                similarity,
                likedEvent: otherUserEvents.includes(eventId.toString())
            };
        });

        // Filter users who liked this event
        const usersWhoLiked = userSimilarities.filter(u => u.likedEvent);

        if (usersWhoLiked.length === 0) {
            return { score: 0, similarUsers: [] };
        }

        // Average similarity of users who liked this event
        const avgSimilarity = usersWhoLiked.reduce((sum, u) => sum + u.similarity, 0) / usersWhoLiked.length;

        return {
            score: avgSimilarity,
            similarUsers: usersWhoLiked.slice(0, 3).map(u => u.userId)
        };
    } catch (error) {
        console.error('[Collaborative Filtering] Error:', error);
        return { score: 0, similarUsers: [] };
    }
};

// Embedding-based similarity: compare event embeddings with user's history
const embeddingBasedScore = async (userId, event) => {
    try {
        if (!event.embedding || event.embedding.length === 0) {
            return { score: 0, similarEvent: null };
        }

        const user = await User.findById(userId)
            .select('savedEvents interestedEvents')
            .lean();

        if (!user) {
            return { score: 0, similarEvent: null };
        }

        const userEventIds = [
            ...user.savedEvents.map(id => id.toString()),
            ...user.interestedEvents.map(id => id.toString())
        ];

        if (userEventIds.length === 0) {
            return { score: 0, similarEvent: null };
        }

        // Get embeddings of user's liked events
        const userEvents = await Event.find({
            _id: { $in: userEventIds },
            embedding: { $exists: true, $ne: [] }
        })
            .select('_id title embedding')
            .lean();

        if (userEvents.length === 0) {
            return { score: 0, similarEvent: null };
        }

        // Calculate similarity with each liked event
        const similarities = userEvents.map(likedEvent => ({
            eventId: likedEvent._id,
            eventTitle: likedEvent.title,
            similarity: cosineSimilarity(event.embedding, likedEvent.embedding)
        }));

        // Get highest similarity
        const bestMatch = similarities.reduce((best, current) =>
            current.similarity > best.similarity ? current : best
        );

        return {
            score: bestMatch.similarity,
            similarEvent: {
                id: bestMatch.eventId,
                title: bestMatch.eventTitle
            }
        };
    } catch (error) {
        console.error('[Embedding-Based] Error:', error);
        return { score: 0, similarEvent: null };
    }
};

// Generate explanation for why event was recommended
const generateExplanation = (contentScore, collaborativeData, embeddingData) => {
    const reasons = [];

    if (embeddingData.similarEvent && embeddingData.score > 0.7) {
        reasons.push(`Similar to "${embeddingData.similarEvent.title}"`);
    }

    if (collaborativeData.similarUsers.length > 0) {
        reasons.push(`${collaborativeData.similarUsers.length} similar users liked this`);
    }

    if (contentScore > 0.5) {
        reasons.push('Matches your interests');
    }

    if (reasons.length === 0) {
        return 'Recommended for you';
    }

    return reasons.join(' • ');
};

// Main recommendation function
export const generateRecommendations = async (userId, limit = 10) => {
    try {
        console.log(`[Recommendations] Generating for user: ${userId}`);

        const user = await User.findById(userId)
            .select('interests location savedEvents interestedEvents')
            .lean();

        if (!user) {
            throw new Error('User not found');
        }

        const userEventIds = [
            ...user.savedEvents.map(id => id.toString()),
            ...user.interestedEvents.map(id => id.toString())
        ];

        // Get candidate events (not already interacted with)
        const candidateEvents = await Event.find({
            _id: { $nin: userEventIds },
            status: 'published',
            isDraft: false,
            date: { $gte: new Date() }
        })
            .select('_id title description categories date location price isFree images metrics organizer embedding')
            .populate('organizer', 'name isVerified')
            .lean();

        console.log(`[Recommendations] Found ${candidateEvents.length} candidate events`);

        // Cold start: user has no interaction history
        if (userEventIds.length === 0) {
            console.log('[Recommendations] Cold start - using interests + location only');

            const coldStartRecommendations = candidateEvents
                .map(event => {
                    const score = contentBasedScore(user.interests, user.location.city, event);

                    return {
                        event,
                        score,
                        explanation: 'Matches your interests and location'
                    };
                })
                .filter(rec => rec.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            console.log(`[Recommendations] Returning ${coldStartRecommendations.length} cold start recommendations`);

            return {
                recommendations: coldStartRecommendations,
                isColdStart: true,
                totalCandidates: candidateEvents.length
            };
        }

        // Calculate scores for all candidate events
        const scoredEvents = await Promise.all(
            candidateEvents.map(async (event) => {
                // Content-based (40%)
                const contentScore = contentBasedScore(user.interests, user.location.city, event);

                // Collaborative filtering (40%)
                const collaborativeData = await collaborativeFilteringScore(userId, event._id, userEventIds);

                // Embedding-based (20%)
                const embeddingData = await embeddingBasedScore(userId, event);

                // Combined score
                const finalScore = (
                    contentScore * 0.4 +
                    collaborativeData.score * 0.4 +
                    embeddingData.score * 0.2
                );

                const explanation = generateExplanation(contentScore, collaborativeData, embeddingData);

                return {
                    event,
                    score: finalScore,
                    explanation,
                    breakdown: {
                        content: contentScore,
                        collaborative: collaborativeData.score,
                        embedding: embeddingData.score
                    }
                };
            })
        );

        // Sort by score and apply diversity
        const sortedRecommendations = scoredEvents
            .filter(rec => rec.score > 0)
            .sort((a, b) => b.score - a.score);

        // Ensure diversity: no more than 3 events from same category
        const diverseRecommendations = [];
        const categoryCount = {};

        for (const rec of sortedRecommendations) {
            const category = rec.event.categories[0];

            if (!categoryCount[category]) {
                categoryCount[category] = 0;
            }

            if (categoryCount[category] < 3) {
                diverseRecommendations.push(rec);
                categoryCount[category]++;
            }

            if (diverseRecommendations.length >= limit) {
                break;
            }
        }

        console.log(`[Recommendations] Returning ${diverseRecommendations.length} recommendations`);

        return {
            recommendations: diverseRecommendations,
            isColdStart: false,
            totalCandidates: candidateEvents.length
        };
    } catch (error) {
        console.error('[Recommendations] Generation failed:', error);
        throw error;
    }
};

// Get personalized feed for user
export const getPersonalizedFeed = async (userId, page = 1, limit = 12) => {
    try {
        const recommendations = await generateRecommendations(userId, limit * 2);

        const skip = (page - 1) * limit;
        const paginatedRecs = recommendations.recommendations.slice(skip, skip + limit);

        return {
            events: paginatedRecs.map(rec => ({
                ...rec.event,
                recommendationScore: rec.score,
                explanation: rec.explanation
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(recommendations.recommendations.length / limit),
                totalEvents: recommendations.recommendations.length
            },
            isColdStart: recommendations.isColdStart
        };
    } catch (error) {
        console.error('[Personalized Feed] Error:', error);
        throw error;
    }
};

export default {
    generateRecommendations,
    getPersonalizedFeed
};