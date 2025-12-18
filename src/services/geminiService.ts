
import { GoogleGenAI, Type } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Label, RosterMember, LabelBudgetOverview, MediaAsset, Project, ProjectTask, MarketInsight } from '../types';
import { AppView, UserRole } from '../types';

let ai: GoogleGenAI | null = null;

const getGenAIClient = (): GoogleGenAI | null => {
    if (!ai) {
        // FIX: Per @google/genai coding guidelines, API key must be obtained exclusively from process.env.API_KEY.
        const apiKey = process.env.API_KEY;
        if (!apiKey || apiKey.startsWith('{{')) return null;
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const askAriaCantata = async (
    history: AriaCantataMessage[],
    question: string,
    currentUser: Artist | Engineer | Stoodio | Producer | Label | null,
    userRole: UserRole | null,
    context: {
        artists: Artist[],
        engineers: Engineer[],
        producers: Producer[],
        stoodioz: Stoodio[],
        bookings: Booking[],
        roster?: RosterMember[],
        budget?: LabelBudgetOverview | null,
        assets?: MediaAsset[],
        projects?: Project[],
        marketInsights?: MarketInsight[]
    }
): Promise<AriaActionResponse> => {
    const ai = getGenAIClient();
    if (!ai) return { type: 'error', target: null, value: null, text: "My connection is cold. Warm me up with a valid key." };

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

    9. **Logout:** Log the user out of the application if they ask to "log out", "sign out", "leave", or "exit".
       - *Command:* {"type": "logout", "text": "Logging you out now. I'll be here when you return."}

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

    try {
        // FIX: Using recommended complex text model as per guidelines.
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${systemInstruction}\n\nUser: ${question}`,
            config: {
                thinkingConfig: { thinkingBudget: 16384 },
                responseMimeType: "application/json"
            }
        });
        
        // FIX: Accessing .text as a property as per guidelines.
        let responseText = response.text.trim();
        return JSON.parse(responseText) as AriaActionResponse;
    } catch (error: any) {
        console.error("Aria logic error:", error);
        return { type: 'speak', target: null, value: null, text: "I'm processing a lot of energy right now. Tell me again what you need from me." };
    }
};

export const fetchLinkMetadata = async (url: string): Promise<LinkAttachment | null> => {
    const ai = getGenAIClient();
    if (!ai) return null;
    try {
        // FIX: Using recommended basic text model as per guidelines.
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Link preview for: ${url}`,
            config: { responseMimeType: "application/json" }
        });
        // FIX: Accessing .text as a property as per guidelines.
        return JSON.parse(response.text);
    } catch (e) { return { url, title: "Link", description: url }; }
};

export const moderatePostContent = async (text: string) => ({ isSafe: true, reason: '' });
export const generateSmartReplies = async (m: any, id: string) => [];
export const getAriaNudge = async (u: any, r: UserRole) => ({ 
    text: "I've been looking at the market trends for us. Ready to find our next big signing?", 
    action: { type: 'OPEN_MODAL', payload: 'ARIA' } 
});
