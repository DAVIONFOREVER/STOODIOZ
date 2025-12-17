import { GoogleGenAI, Type } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Label, RosterMember, LabelBudgetOverview, MediaAsset } from '../types';
import { AppView, UserRole } from '../types';
import { ARIA_EMAIL } from '../constants';

let ai: GoogleGenAI | null = null;

const getGenAIClient = (): GoogleGenAI | null => {
    if (!ai) {
        // FIX: Guidelines require using process.env.API_KEY directly for initialization.
        const apiKey = process.env.API_KEY;
        if (!apiKey || apiKey.startsWith('{{')) {
            return null;
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export const fetchLinkMetadata = async (url: string): Promise<LinkAttachment | null> => {
    const ai = getGenAIClient();
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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
        const metadata = JSON.parse(response.text.trim());
        return { url, title: metadata.title || 'Link', description: metadata.description || url, image_url: metadata.image_url || undefined };
    } catch (error) { return { url, title: 'Link', description: url }; }
};

export const moderatePostContent = async (text: string): Promise<{ isSafe: boolean; reason: string }> => {
    if (!text.trim()) return { isSafe: true, reason: '' };
    const ai = getGenAIClient();
    if (!ai) return { isSafe: true, reason: 'Moderation service offline' };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the following text for harmful content. Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { isSafe: { type: Type.BOOLEAN }, reason: { type: Type.STRING } }
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) { return { isSafe: true, reason: 'Moderation check failed' }; }
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
            model: 'gemini-3-flash-preview',
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
        const result = JSON.parse(response.text.trim());
        return result.replies || [];
    } catch (error) { return []; }
};

export const getAriaNudge = async (currentUser: Artist | Engineer | Stoodio | Producer | Label, userRole: UserRole): Promise<AriaNudgeData | null> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    switch(userRole) {
        case UserRole.ARTIST:
            return { text: "Need to organize your latest demos? I can help you sort your Asset Vault.", action: { type: 'OPEN_MODAL', payload: 'ASSET_VAULT' } };
        case UserRole.LABEL:
            return { text: "I've detected a schedule conflict for Beyoncé's next session. Should I help you resolve it?", action: { type: 'NAVIGATE_DASHBOARD_TAB', payload: 'MASTER_CALENDAR' } };
        default:
            return { text: "Welcome back! How can I assist your operations today?", action: { type: 'OPEN_MODAL', payload: 'ARIA_CHAT' } };
    }
}

export const askAriaCantata = async (
    history: AriaCantataMessage[],
    question: string,
    currentUser: Artist | Engineer | Stoodio | Producer | Label | null,
    // FIX: Pass userRole as parameter to avoid scoping error
    userRole: UserRole | null,
    context: {
        artists: Artist[],
        engineers: Engineer[],
        producers: Producer[],
        stoodioz: Stoodio[],
        bookings: Booking[],
        roster?: RosterMember[],
        budget?: LabelBudgetOverview | null,
        assets?: MediaAsset[]
    }
): Promise<AriaActionResponse> => {
    const ai = getGenAIClient();
    if (!ai) return { type: 'error', target: null, value: null, text: "Offline mode." };

    const systemInstruction = `You are Aria Cantata, the Executive AI Assistant for Stoodioz. 
    You are world-class in A&R operations, digital asset management, and complex scheduling.

    **ADVANCED CAPABILITIES:**
    You must return JSON.

    1. **Scheduling (Calendar Integration):**
       - You can view full roster calendars.
       - If user asks about conflicts: {"type": "scheduleReminder", "value": {"event": " Beyoncé Session", "time": "14:00"}, "text": "Reminder set."}
       - You can suggest rescheduling based on 'stoodioz' availability.

    2. **Performance Analytics & Reporting:**
       - You have access to streaming data (mocked).
       - Command: {"type": "generateReport", "value": {"artistId": "ID", "type": "MONTHLY_SUMMARY"}, "text": "Generating report..."}

    3. **Enhanced Communication:**
       - Draft professional emails: {"type": "sendMessage", "target": "user_id", "value": "AI_DRAFTED_EMAIL_CONTENT", "text": "Drafting email..."}
       
    4. **Digital Asset Management (DAM):**
       - You can "locate" files in context.assets.
       - Help organize: {"type": "navigate", "target": "ASSET_VAULT", "text": "Opening your vault."}

    **CONTEXTUAL DATA:**
    - Current User: ${currentUser?.name} (${userRole})
    - Roster size: ${context.roster?.length || 0}
    - Total Assets: ${context.assets?.length || 0}
    - Active Bookings: ${context.bookings.length}

    If a user wants to "See all my demos," navigate them to the ASSET_VAULT.
    If a user wants to "Book a session for Travis next week," use createBooking if you have date/time.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Upgraded model for complex A&R reasoning
            contents: `${systemInstruction}\n\nUser: ${question}`,
            config: {
                thinkingConfig: { thinkingBudget: 16384 } // Give her room to think through scheduling conflicts
            }
        });
        
        let responseText = response.text.trim();
        if (responseText.startsWith('```json')) responseText = responseText.slice(7, -3).trim();

        try {
            return JSON.parse(responseText) as AriaActionResponse;
        } catch (e) {
            return { type: 'speak', target: null, value: null, text: responseText };
        }
    } catch (error: any) {
        return { type: 'error', target: null, value: null, text: "Aria is recharging. Please try again." };
    }
};