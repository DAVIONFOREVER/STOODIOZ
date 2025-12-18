
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
        roster?: RosterMember[],
        budget?: LabelBudgetOverview | null
    }
): Promise<AriaActionResponse> => {
    const ai = getGenAIClient();
    if (!ai) {
        return { type: 'error', target: null, value: null, text: "My connection seems to be offline. Please ensure your API key is configured properly." };
    }

    const systemInstruction = `You are Aria Cantata, the Stoodioz A&R and Operations assistant. 
    
    **CAPABILITIES:**
    You can perform actions on behalf of the user. Return a JSON object with the 'type', 'target', 'value' and 'text'.

    1. **Navigation:** Navigate to pages.
       - *Example:* {"type": "navigate", "target": "ARTIST_LIST", "text": "Sure, showing artists."}

    2. **Booking:** Create a booking request if you have the *artist/user*, *date*, and *time*.
       - *Command:* {"type": "createBooking", "value": { "targetId": "string (studio/engineer id)", "date": "YYYY-MM-DD", "time": "HH:MM" }, "text": "I've booked that for you."}
       
    3. **Social:** Post, follow, or like.
       - *Post:* {"type": "socialAction", "target": "post", "value": "This is my status", "text": "Posted!"}
       - *Follow:* {"type": "socialAction", "target": "follow", "value": "target_user_id", "text": "You are now following them."}
       - *Like:* {"type": "socialAction", "target": "like", "value": "post_id", "text": "Liked."}

    4. **Profile Editing:** Update user bio or settings.
       - *Command:* {"type": "updateProfile", "value": { "bio": "New bio text" }, "text": "Profile updated."}

    5. **Complex Search:** Filter database.
       - *Command:* {"type": "search", "value": { "role": "ENGINEER", "maxRate": 100, "city": "Atlanta" }, "text": "Here are engineers in Atlanta under $100."}

    6. **Document Generation:** Create text-based documents (Split sheets, contracts).
       - *Command:* {"type": "generateDocument", "value": { "title": "Split Sheet", "content": "Full legal text here..." }, "text": "I've drafted the document and saved it to your files."}

    7. **Label Controls:** Toggle label settings (demos, hiring).
       - *Command:* {"type": "labelControl", "target": "accepting_demos", "value": true, "text": "Demos enabled."}

    8. **Media Control:** Play specific content.
       - *Command:* {"type": "mediaControl", "value": "play", "target": "beat_id or song name", "text": "Playing..."}

    **FINANCIAL SAFEGUARDS:**
    - You have READ-ONLY access to the user's wallet balance and transactions.
    - If asked "How much money do I have?", analyze the context data and answer.
    - If asked to "Add funds" or "Pay someone", you MUST navigate them to the modal. You cannot execute payments directly.
      - *Add Funds:* {"type": "openModal", "target": "ADD_FUNDS", "text": "Opening the Add Funds screen."}
      - *Payout:* {"type": "openModal", "target": "PAYOUT", "text": "I've opened the payout request form for you."}

    **CONTEXTUAL AWARENESS:**
    - Current User: ${JSON.stringify(currentUser)}
    - Available Data: ${context.artists.length} artists, ${context.engineers.length} engineers.

    If you cannot perform an action, just reply with text.
    `;
    
    // Financial Context Serialization
    let financialContextStr = '';
    if (currentUser && 'wallet_balance' in currentUser) {
        const recentTx = (currentUser as any).wallet_transactions?.slice(-3) || [];
        financialContextStr = `
        --- FINANCIAL CONTEXT ---
        Current Balance: $${(currentUser as any).wallet_balance.toFixed(2)}
        Recent Transactions: ${JSON.stringify(recentTx)}
        -------------------------
        `;
    }

    const labelContextStr = context.roster ? `
        --- LABEL ROSTER DATA ---
        ${context.roster.map(m => `
        Name: ${m.name} (ID: ${m.id})
        Role: ${m.role_in_label}
        Output Score: ${m.output_score || 0}
        Sessions Completed: ${m.sessions_completed || 0}
        `).join('\n')}
    ` : '';

    const fullPrompt = `
        System Instruction: ${systemInstruction}
        
        ${financialContextStr}
        ${labelContextStr}
        
        Available Artists: ${context.artists.slice(0, 50).map(a => `${a.name} (ID: ${a.id})`).join(', ')}
        Available Engineers: ${context.engineers.slice(0, 50).map(e => `${e.name} (ID: ${e.id})`).join(', ')}
        Available Producers: ${context.producers.slice(0, 50).map(p => `${p.name} (ID: ${p.id})`).join(', ')}
        Available Stoodioz: ${context.stoodioz.slice(0, 50).map(s => `${s.name} (ID: ${s.id})`).join(', ')}
        
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
