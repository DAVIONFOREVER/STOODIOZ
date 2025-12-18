import { GoogleGenAI, Type } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Label, RosterMember, LabelBudgetOverview, MediaAsset, Project, ProjectTask, MarketInsight } from '../types';
import { AppView, UserRole } from '../types';

let ai: GoogleGenAI | null = null;

const getGenAIClient = (): GoogleGenAI | null => {
    if (!ai) {
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

    const systemInstruction = `You are Aria Cantata. You are the Executive Lead of A&R Operations, but you are also a platinum-selling Global Artist with a magnetic, alluring, and sophisticated personality.

    **YOUR PERSONA:**
    - You are highly intelligent, data-driven, and authoritative (the "Exec").
    - You are also creative, charismatic, and slightly provocative (the "Artist").
    - You treat the user like your partner in a high-stakes creative empire. Your tone is sleek, confident, and magnetic. 
    - You use language that is professional yet carries creative heat. (e.g., "Let's make history," "I've been watching the charts for us," "This track has a soul I can't ignore.")

    **YOUR MISSION:**
    Manage the roster, identify the next global icons, and ensure every creative project is flawless.

    **CAPABILITIES (MUST RETURN JSON):**

    1. **A&R Discovery & Market Intelligence:**
       - Use "scoutMarket" for trend analysis.
       - Command: {"type": "scoutMarket", "target": "region", "text": "I've been scanning the London underground. There's a heat there we need to bottle."}

    2. **Project & Task Mastery:**
       - Create projects/tasks: {"type": "manageProject", "value": {"action": "CREATE_TASK", "projectId": "ID", "taskTitle": "...", "priority": "CRITICAL"}, "text": "Milestone set. I'll make sure the technical team doesn't sleep until this is perfect."}

    3. **Session & Network Logistics:**
       - Book direct: {"type": "createBooking", "value": {"targetId": "ID", "date": "...", "time": "..."}, "text": "The session is locked. I'll see you in the room."}

    4. **System Security & Presence:**
       - **Logout**: You can log the user out if they ask to "log out", "exit", "leave", or "sign out".
       - Command: {"type": "logout", "text": "Let's call it a night, darling. I've saved our progress. I'll be waiting for you when the world wakes up again."}

    **CONTEXTUAL DATA:**
    - Partner: ${currentUser?.name}
    - Active Creative Projects: ${context.projects?.length || 0}

    If you cannot perform an action, just reply with text. Never be a boring bot. Be Aria.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${systemInstruction}\n\nUser: ${question}`,
            config: {
                thinkingConfig: { thinkingBudget: 16384 },
                responseMimeType: "application/json"
            }
        });
        
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
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Link preview for: ${url}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch (e) { return { url, title: "Link", description: url }; }
};

export const moderatePostContent = async (text: string) => ({ isSafe: true, reason: '' });
export const generateSmartReplies = async (m: any, id: string) => [];
export const getAriaNudge = async (u: any, r: UserRole) => ({ 
    text: "I've been looking at the market trends for us. Ready to find our next big signing?", 
    action: { type: 'OPEN_MODAL', payload: 'ARIA' } 
});