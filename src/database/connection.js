import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;

        // Fallback to in-memory server for local testing if no URI provided
        if (!uri || uri === 'mongodb://localhost:27017/matchmaking_test') {
            console.log('No valid MONGO_URI provided in .env. Starting local mongodb-memory-server for testing...');
            mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }

        await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export const disconnectDB = async () => {
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
};
