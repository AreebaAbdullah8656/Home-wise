function formatGeminiError(error, model = "gemini-3.8-flash") {
  if (error && typeof error === "object") {
    const message = String(error.message ?? "").trim();
    if (message) {
      if (!/models\//i.test(message) && !message.includes(model)) {
        return `${message} (model: ${model})`;
      }
      return message;
    }
  }
  return `Gemini request failed (model: ${model}).`;
}

const sample = {
  name: "GoogleGenerativeAIError",
  message:
    "[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent: [404] This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash",
};

const out = formatGeminiError(sample);
const ok =
  out.includes("no longer available") &&
  out.includes("gemini-3.8-flash") &&
  !out.includes("Could not reach Supabase");
console.log(out.slice(0, 180) + "…");
if (!ok) {
  console.error("FAIL format");
  process.exit(1);
}
console.log("PASS: real Gemini message preserved");
