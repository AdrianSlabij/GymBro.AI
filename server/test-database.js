import { connectToMongoDB, closeConnection } from './database.js';

async function testDatabaseConnection() {
  try {
    console.log("Testing MongoDB connection...");
    
    // Test connection
    const client = await connectToMongoDB();
    console.log("✅ MongoDB connection successful!");
    
    // Test database operations (optional)
    const db = client.db("test");
    const collection = db.collection("test");
    
    // Insert a test document
    const result = await collection.insertOne({ 
      test: "Hello MongoDB!", 
      timestamp: new Date() 
    });
    console.log("✅ Inserted test document:", result.insertedId);
    
    // Find the test document
    const found = await collection.findOne({ test: "Hello MongoDB!" });
    console.log("✅ Found test document:", found);
    
    // Clean up - delete the test document
    await collection.deleteOne({ _id: result.insertedId });
    console.log("✅ Cleaned up test document");
    
    // Close connection
    await closeConnection();
    console.log("✅ Database connection closed successfully");
    
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
}

// Run the test
testDatabaseConnection(); 