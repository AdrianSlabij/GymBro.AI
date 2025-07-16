
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { TogetherAIEmbeddings } from "@langchain/community/embeddings/togetherai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb"
import { MongoClient } from "mongodb";
// import dotenv from "dotenv";
// dotenv.config();


const embeddings = new TogetherAIEmbeddings({
  model: "BAAI/bge-base-en-v1.5",
  apiKey: process.env.TOGETHER_API_KEY, 
});



const client = new MongoClient(process.env.MONGODB_URI || "");
const collection = client
  .db(process.env.MONGODB_ATLAS_DB_NAME)
  .collection(process.env.MONGODB_ATLAS_COLLECTION_NAME);

export const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
  collection: collection,
  indexName: "vector_index",
  textKey: "text",
  embeddingKey: "embedding",
});

export const addBookToVectorStore = async (documentData) => {
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

  const [embedding] = await embeddings.embedDocuments([content]);
console.log("Generated embedding:", embedding);
 console.log("Embedding length:", embedding.length);
};


// export const addCommentToVectorStore = async (comment) => {
//   const {
//     _id,
//     name,
//     email,
//     movie_id,
//     text,
//     date
//   } = comment;

//   const docs = [
//     new Document({
//       pageContent: text, // This is what will be embedded
//       metadata: {
//         _id: _id?.toString(), // Convert ObjectId to string if needed
//         name,
//         email,
//         movie_id: movie_id?.toString(), // Convert ObjectId to string if needed
//         date
//       },
//     }),
//   ];

//   // Split the comment into chunks if needed (optional for short comments)
//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 500,
//     chunkOverlap: 100,
//   });
//   const chunks = await splitter.splitDocuments(docs);

//   await vectorStore.addDocuments(chunks);
// };