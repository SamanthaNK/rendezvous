import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000, // Close sockets after 45 seconds
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.error(`Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;