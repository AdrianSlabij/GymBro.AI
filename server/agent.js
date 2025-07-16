//importing langchain openai, since together is openai compatible, openai_api_key is the togeth.ai api key
// https://www.youtube.com/live/kEtGm75uBes?si=NcRwZnpvno4c6lGU&t=4455
// node --env-file=.env agent.js
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";
import { MongoClient, ServerApiVersion } from 'mongodb';

import data from "./data.js";

import { vectorStore, addBookToVectorStore } from "./embeddings.js";

// MongoDB connection setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function testMongoConnection() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  } finally {
    await client.close();
  }
}

// Test MongoDB connection
await testMongoConnection();

//**step 1 indexing**: load, split, embed, store
const video1 = data[0];
await addBookToVectorStore(data[0]);
await addBookToVectorStore(data[1]);

//retrieval tool
const retrieveTool = tool(
  
  async ({ query }) => {console.log("Retrieval tool initialized")
    //(doc) => doc.metadata.id === id is a filter function to only retrieve the documents with the same id -> only works for memory vectore store, would be different for other databases
    try{const retrievedDocs = await vectorStore.similaritySearch(
      query,
      3
    );
    console.log("Retrieved docs:", retrievedDocs);

    const serializedDocs = retrievedDocs
      .map((doc) => doc.pageContent)
      .join("\n\n");
    console.log(serializedDocs);
    return serializedDocs;
  } catch (error) {
    console.error("Error in retrieval tool:", error);
    return "Error in retrieval tool";
  }
  },
  {
    name: "retrieve",
    description: "Retrieve the most relevant chunks from the content",
    schema: z.object({
      query: z.string(),
    }),
  }
);

const llm = new ChatOpenAI({
  model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  openAIApiKey: process.env.TOGETHER_API_KEY,
  configuration: {
    baseURL: "https://api.together.xyz/v1",
  },
});

const checkpointer = new MemorySaver();

const agent = createReactAgent({
  llm,
  tools: [retrieveTool],
  checkpointer,
});

//testing the agent
const id = 1; //id of the first data json in data.js

console.log("Q1: Who is known as the goat of the unimaginable?");
const results = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content:
          "Based on the documents provided, Who is known as the goat of the unimaginable?",
      },
    ],
  },
  { configurable: { thread_id: 1} }
);

console.log(results.messages.at(-1)?.content);
