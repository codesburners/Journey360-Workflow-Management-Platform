import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCEcKl-vuuhVwRTAmnK3ts1Raa31GPbfvQ");

async function runChat(prompt) {
    try {
        // Actually, gemini-1.5-flash is the stable model.
        const validModel = "gemini-1.5-flash";

        const modelInstance = genAI.getGenerativeModel({ model: validModel });

        const currentDate = new Date().toLocaleString();
        const enhancedPrompt = `Current System Date/Time: ${currentDate}. You are Journey360 AI, a helpful travel assistant. \n\nUser Query: ${prompt}`;

        const result = await modelInstance.generateContent(enhancedPrompt);
        const output = result.response.text();
        return output;
    } catch (error) {
        console.error("Error generating content:", error);
        return "I'm having trouble connecting to the AI right now. Please try again later.";
    }
}

export default runChat;
