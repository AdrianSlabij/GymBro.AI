//importing langchain openai, since together is openai compatible, openai_api_key is the togeth.ai api key 
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import data from "./data.js";


import dotenv from "dotenv";

// Load environment variables
dotenv.config();

//**step 1 indexing**: load, split, embed, store
const video1 = data[0]

const docs = [new Document({pageContent: video1.content, metadata: {source: video1.source}})];

// split the video into chunks
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
});
const chunks = await splitter.splitDocuments(docs);
// console.log(chunks);

//**step 2 embedding **
const embeddings = new OpenAIEmbeddings({
    model: "BAAI/bge-base-en-v1.5",
    openAIApiKey: process.env.TOGETHER_API_KEY,
    configuration: {
        baseURL: "https://api.together.xyz/v1",
    },
});

const vectorStore = new MemoryVectorStore(embeddings);

await vectorStore.addDocuments(chunks);

// retrieve the most relevant chunks
const retrievedDocs = await vectorStore.similaritySearch("Who is known as the goat of the unimaginable?", 2);

//console.log(retrievedDocs);


//retrieval tool
const retrieveTool = tool(async({query}) => {
    console.log("retrieving docs for query:", query);
    const retrievedDocs = await vectorStore.similaritySearch(query, 3);
    console.log("Retrieved documents:", retrievedDocs);
    
    const serializedDocs = retrievedDocs.map(doc => doc.pageContent).join("\n\n");
    console.log("Serialized documents:", serializedDocs);
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
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    openAIApiKey: process.env.TOGETHER_API_KEY,
    configuration: {
        baseURL: "https://api.together.xyz/v1",
    },
});

const agent = createReactAgent({
    llm,
    tools: [retrieveTool],
});


const results = await agent.invoke({messages:[{role: "user", content: "Based on the documents provided, Who is known as the goat of the unimaginable and why?"}],    
}
);

console.log(results.messages.at(-1)?.content);



