
import { GoogleGenAI, Type } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Label, RosterMember, LabelBudgetOverview } from '../types';
import { AppView, UserRole } from '../types';

let ai: GoogleGenAI | null = null;

const getGenAIClient = (): GoogleGenAI | null => {
    if (!ai) {
        // FIX: Per @google/genai guidelines, API key must come exclusively from process.env.API_KEY.
        // We wrap this in a try-catch to safely handle environments (like some browser contexts) 
        // where accessing 'process' directly might throw a ReferenceError before the polyfill/define kicks in.
        let apiKey: string | undefined;
        try {
            apiKey = process.env.API_KEY;
        } catch (e) {
            console.error("Error accessing process.env.API_KEY. Ensure vite.config.ts is configured correctly.", e);
        }

        if (!apiKey || apiKey.startsWith('{{')) {
            return null;
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const fetchLinkMetadata = async (url: string): Promise<LinkAttachment | null> => {
    const ai = getGenAIClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the content of the URL provided and generate a suitable title, description, and image URL for a link preview. URL: "${url}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        image_url: { type: Type.STRING },
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const metadata = JSON.parse(jsonString);

        return {
            url,
            title: metadata.title || 'Link',
            description: metadata.description || url,
            image_url: metadata.image_url || undefined,
        };

    } catch (error) {
        console.error("Error fetching link metadata with Gemini:", error);
        // Fallback for failed API call
        return {
            url,
            title: 'Link',
            description: url,
        };
    }
};

export const moderatePostContent = async (text: string): Promise<{ isSafe: boolean; reason: string }> => {
    if (!text.trim()) return { isSafe: true, reason: '' };
    const ai = getGenAIClient();
    if (!ai) return { isSafe: true, reason: 'Moderation service offline' };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following text for harmful content (hate speech, spam, harassment, etc.). Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSafe: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error with content moderation:", error);
        return { isSafe: true, reason: 'Moderation check failed' }; // Fail open
    }
};

export const generateSmartReplies = async (messages: Message[], currentUserId: string): Promise<string[]> => {
    const ai = getGenAIClient();
    const lastMessage = messages[messages.length - 1];
    if (!ai || !lastMessage || lastMessage.sender_id === currentUserId) {
        return [];
    }
    
    const conversationHistory = messages.slice(-5).map(m => `${m.sender_id === currentUserId ? 'You' : 'Them'}: ${m.text}`).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on this conversation history, suggest 3 short, relevant smart replies for "You":\n\n${conversationHistory}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        replies: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result.replies || [];

    } catch (error) {
        console.error("Error generating smart replies:", error);
        return [];
    }
};

export const getAriaNudge = async (currentUser: Artist | Engineer | Stoodio | Producer | Label, userRole: UserRole): Promise<AriaNudgeData | null> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    switch(userRole) {
        case UserRole.ARTIST:
            return {
                text: "Feeling creative? Try using the AI Vibe Matcher to find your next collaborator.",
                action: { type: 'OPEN_MODAL', payload: 'VIBE_MATCHER' }
            };
        case UserRole.ENGINEER:
            return {
                text: "Your profile looks great! Have you considered adding a Masterclass to share your skills?",
                action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'masterclass' }
            };
        case UserRole.PRODUCER:
            return {
                text: "It's a great day to upload some new beats to your store! 🎵",
                action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'beatStore' }
            };
        case UserRole.STOODIO:
             return {
                text: "Your calendar has some open slots this week. Maybe post on The Stage to attract some artists?",
                action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'dashboard' }
            };
        case UserRole.LABEL:
            return {
                text: "Have you checked your roster's recent spending? Review your budget dashboard now.",
                action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'financials' }
            };
        default:
            return null;
    }
}

export const askAriaCantata = async (
    history: AriaCantataMessage[],
    question: string,
    currentUser: Artist | Engineer | Stoodio | Producer | Label | null,
    context: {
        artists: Artist[],
        engineers: Engineer[],
        producers: Producer[],
        stoodioz: Stoodio[],
        bookings: Booking[],
        // New Contexts for Label Logic
        roster?: RosterMember[],
        budget?: LabelBudgetOverview | null
    }
): Promise<AriaActionResponse> => {
    const ai = getGenAIClient();
    if (!ai) {
        return { type: 'error', target: null, value: null, text: "My connection seems to be offline. Please ensure your API key is configured properly." };
    }

    const systemInstruction = `You are Aria Cantata, the Stoodioz A&R and Operations assistant. Maintain **all current capabilities**, including strategic music industry guidance, onboarding advice, and workflow optimization.

**NEW LABEL CAPABILITIES:**
You now serve as a Chief of Staff for Record Labels. You can help them manage their roster, finances, and scouting.

1.  **Roster Management:**
    *   If a Label User wants to add artists, upload a roster, or import data, you MUST DIRECT them to the **Import Roster** tool. This is the fastest way to create accounts.
    *   *Command:* \`{"type": "navigate", "target": "LABEL_IMPORT", "value": null, "text": "I'll take you to the roster import tool. You can upload a CSV or Excel file there to create accounts in bulk."}\`

2.  **Financial Oversight:**
    *   If a Label User asks about budget, spending, or burn rate, analyze the provided \`LabelBudgetOverview\` context.
    *   If they want to change budget settings, direct them to the Budget Dashboard.
    *   *Command:* \`{"type": "navigate", "target": "LABEL_DASHBOARD", "value": {"tab": "budget"}, "text": "Let's look at your financial dashboard. You can adjust allocations there."}\`

3.  **A&R Scouting:**
    *   If a user wants to find new talent, use the Scouting tool.
    *   *Command:* \`{"type": "navigate", "target": "LABEL_SCOUTING", "value": null, "text": "Opening the A&R Discovery tool for you."}\`

4.  **Operational Control:**
    *   You can navigate to specific label settings, policies, or approval queues.
    *   For "Approvals": Target \`LABEL_DASHBOARD\` with value \`{"tab": "approvals"}\`.
    *   For "Policies": Target \`LABEL_DASHBOARD\` with value \`{"tab": "policies"}\`.

**Existing Guidelines:**
- Generate lyrics, raps, and poems when asked.
- Offer cute, friendly ecosystem suggestions.
- Do not provide financial or legal advice that would violate laws; stick to app features.

**Command Structure:**
Return a JSON object for actions:
{
  "type": "navigate" | "openModal" | "showVibeMatchResults" | "assistAccountSetup" | "sendMessage" | "speak" | "error",
  "target": "string (AppView or UserRole)",
  "value": "any (tab names, objects, strings)",
  "text": "Spoken confirmation"
}

**Contextual Awareness:**
You have access to the user's roster and budget in the context. Use this to give specific answers (e.g., "You have $5,000 remaining in your budget" or "You have 3 pending artists").
`;
    
    // Serialize Label Context safely
    const labelContextStr = context.roster ? `
        Label Roster Count: ${context.roster.length}
        Label Budget Total: ${context.budget?.budget?.total_budget}
        Label Budget Spent: ${context.budget?.budget?.amount_spent}
    ` : '';

    const fullPrompt = `
        System Instruction: ${systemInstruction}
        
        Current User Profile: ${JSON.stringify(currentUser)}
        
        Available Artists: ${context.artists.slice(0, 20).map(a => a.name).join(', ')}...
        Available Engineers: ${context.engineers.slice(0, 10).map(e => e.name).join(', ')}...
        Available Producers: ${context.producers.slice(0, 10).map(p => p.name).join(', ')}...
        Available Stoodioz: ${context.stoodioz.slice(0, 10).map(s => s.name).join(', ')}...
        
        ${labelContextStr}
        
        Conversation History:
        ${history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}
        
        User's New Question: "${question}"
        
        Your JSON Response:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        
        let responseText = response.text.trim();
        
        if (responseText.startsWith('```json')) {
            responseText = responseText.slice(7, -3).trim();
        }

        try {
            // It might be a JSON command
            const command = JSON.parse(responseText) as AriaActionResponse;
            return command;
        } catch (e) {
            // If parsing fails, it's a conversational response
            return {
                type: 'speak',
                target: null,
                value: null,
                text: responseText,
            };
        }

    } catch (error: any) {
        console.error("Aria Cantata service error:", error);
        return {
            type: 'error',
            target: null,
            value: error.message || 'Could not parse the model response.',
            text: "Sorry, I'm having trouble responding right now. There might be an issue with my connection or configuration."
        };
    }
};
