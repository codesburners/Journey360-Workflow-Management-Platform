import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCXtd-JPIwsawdwwURxuDCKSkxft-jWh5A";

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Valid Models Found:");
            data.models.forEach(m => {
                if (m.name.includes("gemini")) {
                    console.log(m.name); // e.g. models/gemini-pro
                }
            });
        } else {
            console.log("No 'models' property in response. Full response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
