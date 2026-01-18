import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Event from '../models/eventModel.js';
import { generateRecommendations } from '../services/recommendationService.js';

dotenv.config();

const testFeed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully\n');

        // Test Case 1: New user with no history (Cold Start)
        console.log('=== Test Case 1: Cold Start User ===');
        const newUser = await User.findOne({ role: 'user' }).sort('createdAt').lean();

        if (newUser && (!newUser.savedEvents || newUser.savedEvents.length === 0)) {
            console.log(`Testing with user: ${newUser.name} (${newUser.email})`);
            console.log(`Interests: ${newUser.interests.join(', ')}`);
            console.log(`Location: ${newUser.location.city}`);

            const coldStartRecs = await generateRecommendations(newUser._id.toString(), 10);

            console.log(`\nCold Start: ${coldStartRecs.isColdStart}`);
            console.log(`Recommendations: ${coldStartRecs.recommendations.length}`);

            if (coldStartRecs.recommendations.length > 0) {
                console.log('\nTop 3 Recommendations:');
                coldStartRecs.recommendations.slice(0, 3).forEach((rec, i) => {
                    console.log(`\n${i + 1}. ${rec.event.title}`);
                    console.log(`   Category: ${rec.event.categories[0]}`);
                    console.log(`   Score: ${rec.score.toFixed(3)}`);
                    console.log(`   Explanation: ${rec.explanation}`);
                });
            }
        } else {
            console.log('No cold start user found, skipping test case 1');
        }

        // Test Case 2: Active user with interaction history
        console.log('\n\n=== Test Case 2: Active User ===');
        const activeUser = await User.findOne({
            role: 'user',
            savedEvents: { $exists: true, $ne: [] }
        })
            .populate('savedEvents', 'title categories')
            .lean();

        if (activeUser) {
            console.log(`Testing with user: ${activeUser.name} (${activeUser.email})`);
            console.log(`Interests: ${activeUser.interests.join(', ')}`);
            console.log(`Location: ${activeUser.location.city}`);
            console.log(`Saved Events: ${activeUser.savedEvents.length}`);

            if (activeUser.savedEvents.length > 0) {
                console.log('\nSaved Events:');
                activeUser.savedEvents.slice(0, 3).forEach((event, i) => {
                    console.log(`  ${i + 1}. ${event.title} (${event.categories[0]})`);
                });
            }

            const activeRecs = await generateRecommendations(activeUser._id.toString(), 10);

            console.log(`\nCold Start: ${activeRecs.isColdStart}`);
            console.log(`Recommendations: ${activeRecs.recommendations.length}`);

            if (activeRecs.recommendations.length > 0) {
                console.log('\nTop 5 Recommendations:');
                activeRecs.recommendations.slice(0, 5).forEach((rec, i) => {
                    console.log(`\n${i + 1}. ${rec.event.title}`);
                    console.log(`   Category: ${rec.event.categories[0]}`);
                    console.log(`   Score: ${rec.score.toFixed(3)}`);
                    console.log(`   Breakdown:`);
                    console.log(`     - Content: ${rec.breakdown.content.toFixed(3)}`);
                    console.log(`     - Collaborative: ${rec.breakdown.collaborative.toFixed(3)}`);
                    console.log(`     - Embedding: ${rec.breakdown.embedding.toFixed(3)}`);
                    console.log(`   Explanation: ${rec.explanation}`);
                });
            }
        } else {
            console.log('No active user found, skipping test case 2');
        }

        // Test Case 3: User with followed organizers
        console.log('\n\n=== Test Case 3: User with Followed Organizers ===');
        const userWithFollows = await User.findOne({
            role: 'user',
            followedOrganizers: { $exists: true, $ne: [] }
        })
            .populate('followedOrganizers', 'name')
            .lean();

        if (userWithFollows) {
            console.log(`Testing with user: ${userWithFollows.name} (${userWithFollows.email})`);
            console.log(`Following: ${userWithFollows.followedOrganizers.length} organizers`);

            if (userWithFollows.followedOrganizers.length > 0) {
                console.log('\nFollowed Organizers:');
                userWithFollows.followedOrganizers.slice(0, 3).forEach((org, i) => {
                    console.log(`  ${i + 1}. ${org.name}`);
                });
            }

            const followedOrgEvents = await Event.find({
                organizer: { $in: userWithFollows.followedOrganizers.map(o => o._id) },
                status: 'published',
                isDraft: false,
                date: { $gte: new Date() }
            })
                .select('title organizer')
                .populate('organizer', 'name')
                .limit(5)
                .lean();

            console.log(`\nEvents from followed organizers: ${followedOrgEvents.length}`);
            if (followedOrgEvents.length > 0) {
                followedOrgEvents.forEach((event, i) => {
                    console.log(`  ${i + 1}. ${event.title} by ${event.organizer.name}`);
                });
            }
        } else {
            console.log('No user with followed organizers found, skipping test case 3');
        }

        // Test Case 4: Check trending events
        console.log('\n\n=== Test Case 4: Trending Events ===');
        const trendingEvents = await Event.aggregate([
            {
                $match: {
                    status: 'published',
                    isDraft: false,
                    date: { $gte: new Date() }
                }
            },
            {
                $addFields: {
                    engagementScore: {
                        $add: [
                            { $multiply: [{ $ifNull: ['$metrics.saves', 0] }, 2] },
                            { $ifNull: ['$metrics.interested', 0] }
                        ]
                    }
                }
            },
            {
                $sort: { engagementScore: -1 }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    title: 1,
                    'metrics.saves': 1,
                    'metrics.interested': 1,
                    engagementScore: 1
                }
            }
        ]);

        console.log(`Top ${trendingEvents.length} Trending Events:`);
        trendingEvents.forEach((event, i) => {
            console.log(`\n${i + 1}. ${event.title}`);
            console.log(`   Saves: ${event.metrics?.saves || 0}`);
            console.log(`   Interested: ${event.metrics?.interested || 0}`);
            console.log(`   Engagement Score: ${event.engagementScore}`);
        });

        // Summary Statistics
        console.log('\n\n=== Summary Statistics ===');
        const totalUsers = await User.countDocuments({ role: 'user' });
        const usersWithHistory = await User.countDocuments({
            role: 'user',
            $or: [
                { savedEvents: { $exists: true, $ne: [] } },
                { interestedEvents: { $exists: true, $ne: [] } }
            ]
        });
        const totalEvents = await Event.countDocuments({ status: 'published', isDraft: false });
        const eventsWithEmbeddings = await Event.countDocuments({
            status: 'published',
            isDraft: false,
            embedding: { $exists: true, $ne: [] }
        });

        console.log(`Total Users: ${totalUsers}`);
        console.log(`Users with History: ${usersWithHistory} (${((usersWithHistory / totalUsers) * 100).toFixed(1)}%)`);
        console.log(`Total Published Events: ${totalEvents}`);
        console.log(`Events with Embeddings: ${eventsWithEmbeddings} (${((eventsWithEmbeddings / totalEvents) * 100).toFixed(1)}%)`);

        console.log('\n All tests completed successfully!');
    } catch (error) {
        console.error('\n Test failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
};

testFeed();