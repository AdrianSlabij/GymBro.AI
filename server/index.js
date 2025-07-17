import express from "express";
import cors from "cors";
import { agent } from "./agent.js";


const PORT = process.env.PORT || 3000;


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/generate", async (req, res) => {
  const { query, thread_id } = req.body;
  console.log(query, thread_id);

//testing the agent
const results = await agent.invoke(
  {
    messages: [
      {role: "system", content: "Do not say it seems like there is extra information in the response. Just answer the question."},
      {
        role: "user",
        content:
          query,
      },
    ],
  },
  { configurable: { thread_id: 1} }
);

console.log(results.messages.at(-1)?.content);

  const lastMessage = results.messages.at(-1);
  res.send(lastMessage?.content || "");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





