import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Event from '../models/eventModel.js';
import { generateBatchEmbeddings } from '../services/aiService.js';

dotenv.config();

const BATCH_SIZE = 5;

const migrateEmbeddings = async () => {
    try {
        console.log('Embedding Migration Script\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const eventsWithoutEmbeddings = await Event.find({
            status: 'published',
            isDraft: false,
            $or: [
                { embedding: { $exists: false } },
                { embedding: [] },
                { embedding: null }
            ]
        })
            .select('_id title description categories')
            .lean();

        const totalEvents = eventsWithoutEmbeddings.length;

        if (totalEvents === 0) {
            console.log('No events need embedding generation. All done!\n');
            process.exit(0);
        }

        console.log(`Found ${totalEvents} events without embeddings`);
        console.log(`Processing in batches of ${BATCH_SIZE}`);
        console.log(`Estimated time: ~${Math.ceil(totalEvents * 3 / 60)} minutes`);
        console.log('Using 3 second delay between requests\n');

        const totalBatches = Math.ceil(totalEvents / BATCH_SIZE);
        console.log(`WARNING: This will make ${totalEvents} API calls`);
        console.log(`Free tier limit: 1000 requests/day`);
        console.log(`Remaining after this: ~${1000 - totalEvents} requests\n`);

        console.log('Press Ctrl+C to cancel, or wait 5 seconds to start...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        let totalSuccess = 0;
        let totalFailed = 0;

        for (let i = 0; i < eventsWithoutEmbeddings.length; i += BATCH_SIZE) {
            const batch = eventsWithoutEmbeddings.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            console.log(`\n=== Batch ${batchNumber}/${totalBatches} ===`);
            console.log(`Processing events ${i + 1} to ${Math.min(i + BATCH_SIZE, totalEvents)}`);

            const result = await generateBatchEmbeddings(batch);

            for (const item of result.results) {
                if (item.success && item.embedding) {
                    try {
                        await Event.findByIdAndUpdate(item.eventId, {
                            embedding: item.embedding
                        });
                        console.log(`Saved embedding for event: ${item.eventId}`);
                        totalSuccess++;
                    } catch (error) {
                        console.error(`Failed to save embedding for ${item.eventId}:`, error.message);
                        totalFailed++;
                    }
                } else {
                    console.error(`Failed to generate embedding for ${item.eventId}`);
                    totalFailed++;
                }
            }

            console.log(`Batch ${batchNumber} complete: ${result.successCount} success, ${result.failCount} failed`);

            if (i + BATCH_SIZE < eventsWithoutEmbeddings.length) {
                console.log('Waiting 5 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        console.log('\nMigration Complete');
        console.log(`Total events processed: ${totalEvents}`);
        console.log(`Successfully generated: ${totalSuccess}`);
        console.log(`Failed: ${totalFailed}`);
        console.log(`Success rate: ${totalEvents > 0 ? ((totalSuccess / totalEvents) * 100).toFixed(1) : 0}%\n`);

        if (totalFailed > 0) {
            console.log('TROUBLESHOOTING TIPS:');
            console.log('1. Check your Hugging Face API key is valid');
            console.log('2. Verify you have not exceeded free tier limits (1000/day)');
            console.log('3. Try again in a few hours if rate limited');
            console.log('4. Check https://hf.co/settings/tokens for API status\n');
        }

    } catch (error) {
        console.error('\nMigration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
};

migrateEmbeddings();