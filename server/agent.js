//importing langchain openai, since together is openai compatible, openai_api_key is the togeth.ai api key
// https://www.youtube.com/live/kEtGm75uBes?si=NcRwZnpvno4c6lGU&t=4455
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";

import data from "./data.js";

import { vectorStore, addDocumentsToVectorStore } from "./embeddings.js";

//**step 1 indexing**: load, split, embed, store
const video1 = data[0];
await addDocumentsToVectorStore(video1);

//retrieval tool
const retrieveTool = tool(
  async ({ query }, { configurable: { id } }) => {
    //(doc) => doc.metadata.id === id is a filter function to only retrieve the documents with the same id -> only works for memory vectore store, would be different for other databases
    const retrievedDocs = await vectorStore.similaritySearch(
      query,
      3,
      (doc) => doc.metadata.id === id
    );

    const serializedDocs = retrievedDocs
      .map((doc) => doc.pageContent)
      .join("\n\n");

    return serializedDocs;
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
  { configurable: { thread_id: 1, id } }
);

console.log(results.messages.at(-1)?.content);
