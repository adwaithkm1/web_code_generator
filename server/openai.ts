import { GoogleGenerativeAI } from "@google/generative-ai";
import { CodeGenerationRequest } from "@shared/schema";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateCode(request: CodeGenerationRequest): Promise<string> {
  const prompt = `Generate production-ready code in ${request.language} for the following request:
${request.prompt}

Please provide only the code without any explanations. Ensure the code follows best practices, includes proper error handling, and is well-documented.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });

    if (!result.response) {
      throw new Error("No response from Gemini API");
    }

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error(`Code generation failed: ${error.message}`);
  }
}