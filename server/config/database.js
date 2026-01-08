import mongoose from 'mongoose';

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rendezvous';
    console.log('[DB] Connecting to MongoDB using URI:', process.env.MONGODB_URI ? 'MONGODB_URI (from env)' : uri);
    try {
        const conn = await mongoose.connect(uri, {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000, // Close sockets after 45 seconds
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.error(`Connection Error: ${error.message}`);
        console.error('[DB] Failed to connect to MongoDB. If you intended to use a remote DB, set a valid MONGODB_URI in your environment.');
        // Do not exit the process here to allow the dev server and client to run
        // for frontend development or non-db-dependent flows.
    }
};

export default connectDB;