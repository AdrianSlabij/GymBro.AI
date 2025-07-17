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



  res.json(results.messages.at(-1));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





