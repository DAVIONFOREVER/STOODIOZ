import { GoogleGenAI, Type } from "@google/genai";
import type { Stoodio, Engineer, Message, VibeMatchResult } from '../types';

// FIX: Initialized Gemini API client as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });


/**
 * Analyzes a song's vibe and recommends stoodioz and engineers.
 */
export const getVibeMatchResults = async (
    songUrl: string,
    stoodioz: Stoodio[],
    engineers: Engineer[]
): Promise<VibeMatchResult> => {
    console.log("Analyzing vibe for:", songUrl);

    // FIX: Using gemini-2.5-flash model.
    const model = 'gemini-2.5-flash';

    const prompt = `
        Analyze the musical vibe of the song at this URL: ${songUrl}.
        Based on the vibe, recommend up to 2 stoodioz and 2 engineers from the lists provided.
        Provide a short, compelling reason for each recommendation.
        Also, give a one-sentence description of the song's overall vibe and 3-5 descriptive tags.

        Available Stoodioz:
        ${JSON.stringify(stoodioz.map(s => ({ id: s.id, name: s.name, description: s.description, amenities: s.amenities })), null, 2)}

        Available Engineers:
        ${JSON.stringify(engineers.map(e => ({ id: e.id, name: e.name, bio: e.bio, specialties: e.specialties })), null, 2)}
        
        Return the response in a JSON format.
    `;

    try {
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                vibeDescription: { type: Type.STRING },
                tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
                recommendations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            entityId: { type: Type.STRING },
                            reason: { type: Type.STRING },
                        },
                        required: ["type", "entityId", "reason"],
                    },
                },
            },
             required: ["vibeDescription", "tags", "recommendations"],
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

        const recommendations = jsonResponse.recommendations.map((rec: any) => {
            let entity: Stoodio | Engineer | undefined;
            if (rec.type === 'stoodio') {
                entity = stoodioz.find(s => s.id === rec.entityId);
            } else {
                entity = engineers.find(e => e.id === rec.entityId);
            }
            return entity ? { ...rec, entity } : null;
        }).filter(Boolean);

        const result: VibeMatchResult = {
            vibeDescription: jsonResponse.vibeDescription,
            tags: jsonResponse.tags,
            recommendations: recommendations,
        };

        return result;

    } catch (error) {
        console.error("Error calling Gemini API for vibe match:", error);
        // Fallback to a mock result on error
        return {
            vibeDescription: 'A dreamy, atmospheric track with lo-fi beats and ethereal vocals.',
            tags: ['Dream Pop', 'Lo-fi', 'Indie', 'Chillwave'],
            recommendations: [
                {
                    type: 'stoodio',
                    entity: stoodioz[0],
                    reason: 'Echo Chamber has vintage gear perfect for capturing that warm, hazy sound.',
                },
                {
                    type: 'engineer',
                    entity: engineers[0],
                    reason: 'Alex Robinson specializes in indie rock and has a great ear for atmospheric textures.',
                },
            ],
        };
    }
};

/**
 * Generates smart replies for a conversation.
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