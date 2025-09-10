import { GoogleGenAI, Type } from "@google/genai";
import type { Message } from '../types';

// FIX: Initialized Gemini API client as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates smart replies for a conversation.
 * NOTE: In a production application, this function should also be moved to a secure backend
 * to protect your API key. It is left here for demonstration purposes.
 */
export const generateSmartReplies = async (
    messages: Message[],
    currentUserId: string
): Promise<string[]> => {
    
    // FIX: Using gemini-2.5-flash model.
    const model = 'gemini-2.5-flash';

    const conversationHistory = messages.map(msg => 
        `${msg.senderId === currentUserId ? 'You' : 'Them'}: ${msg.text}`
    ).join('\n');

    const prompt = `
        You are a helpful assistant for a messaging feature in a music collaboration app.
        Based on the following conversation history, generate 3-4 short, context-aware smart replies for "You".
        The replies should be helpful and move the conversation forward.
        Examples: "Sounds good!", "When are you free?", "Let's book it.", "Can you send a sample?"
        
        Conversation:
        ${conversationHistory}

        Your smart replies for "You":
    `;

    try {
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                replies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ["replies"],
        };

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema,
            }
        });
        
        // FIX: Extracting text output directly from response.text property.
        const jsonResponse = JSON.parse(response.text);

        if (jsonResponse.replies && Array.isArray(jsonResponse.replies)) {
            return jsonResponse.replies.slice(0, 4); // Limit to 4 replies
        }
        
        return [];
    } catch (error) {
        console.error("Error calling Gemini API for smart replies:", error);
        // Fallback on error
        return ["Sounds good!", "I'm available.", "What's the rate?"];
    }
};