import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Event from '../models/eventModel.js';

dotenv.config();

const fixDateFormats = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully\n');

        const events = await Event.find({}).lean();
        console.log(`Found ${events.length} events to check`);

        let fixed = 0;
        let skipped = 0;

        for (const event of events) {
            // Check if date is stored as string
            if (typeof event.date === 'string') {
                console.log(`Fixing event: ${event.title} (${event._id})`);
                console.log(`  Old date: ${event.date} (${typeof event.date})`);

                const dateObj = new Date(event.date);

                if (isNaN(dateObj.getTime())) {
                    console.log(`  ERROR: Invalid date, skipping`);
                    skipped++;
                    continue;
                }

                await Event.findByIdAndUpdate(event._id, {
                    date: dateObj
                });

                console.log(`  New date: ${dateObj.toISOString()} (Date object)`);
                fixed++;
            } else {
                skipped++;
            }
        }

        console.log(`\nMigration complete:`);
        console.log(`- Fixed: ${fixed} events`);
        console.log(`- Skipped: ${skipped} events (already Date objects)`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
};

fixDateFormats();