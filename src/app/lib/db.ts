import mongoose from "mongoose";

export const connectToDB = async () => {
  try {
    // Check if MongoDB URI is provided
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB is already connected");
      return;
    }

    console.log("🔄 Attempting to connect to MongoDB...");
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log("✅ Successfully connected to MongoDB!");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error("❌ MongoDB connection error:", error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on('reconnected', () => {
      console.log("🔄 MongoDB reconnected");
    });

  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:");
    console.error("Error details:", error);
    
    // Exit process if database connection fails
    process.exit(1);
  }
};