const fetch = require("node-fetch");

const Apis = ["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", "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"]

const GROQ_API_KEY = Apis[Math.floor(Math.random() * Apis.length)];

async function askGroqWithImage(prompt, imageUrl, model = "meta-llama/llama-4-scout-17b-16e-instruct") {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 1,
        max_completion_tokens: 1024
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from model.";
  } catch (error) {
    console.error("Error:", error);
    return "Error while fetching response.";
  }
}

module.exports = {
  name: "Ai With Image",
  desc: "AI with image input",
  category: "Openai",
  path: "/ai/gemini?apikey=&prompt=&imageUrl=",

  async run(req, res) {
    const { prompt, imageUrl, apikey } = req.query;

    // Validasi input
    if (!prompt) return res.json({ status: false, error: "Prompt is required" });
    if (!imageUrl) return res.json({ status: false, error: "Image URL is required" });
    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Invalid API key" });
    }

    try {
      const data = await askGroqWithImage(prompt, imageUrl);
      if (!data) {
        return res.status(500).json({ status: false, error: "No response from AI" });
      }
      res.json({ status: true, result: data });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};