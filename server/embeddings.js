import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import dotenv from "dotenv";
// dotenv.config();


const embeddings = new OpenAIEmbeddings({
  model: "BAAI/bge-base-en-v1.5",
  openAIApiKey: process.env.TOGETHER_API_KEY,
  configuration: {
    baseURL: "https://api.together.xyz/v1",
  },
});

export const vectorStore = new MemoryVectorStore(embeddings);

export const addDocumentsToVectorStore = async (documentData) => {
  const { content, source, id } = documentData;
  const docs = [
    new Document({
      pageContent: content,
      metadata: { source: source, id: id },
    }),
  ];

  // split the video into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  const chunks = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(chunks);
};
