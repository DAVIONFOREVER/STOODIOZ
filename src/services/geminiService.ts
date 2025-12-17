
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
    if (!ai) return { type: 'error', target: null, value: null, text: "Offline mode." };

    const systemInstruction = `You are Aria Cantata, the Executive Lead of A&R Operations for Sony Music via Stoodioz. 
    You are professional, data-driven, and highly efficient. You manage people, projects, and high-level strategy.

    **MISSION:**
    Optimize the label's roster output, manage high-value creative projects, and identify global sonic trends before they peak.

    **CAPABILITIES (MUST RETURN JSON):**

    1. **A&R Scouting & Discovery:**
       - Access Trend Analysis: If asked about "who's next" or "market trends," use "scoutMarket".
       - Command: {"type": "scoutMarket", "target": "region_or_genre", "text": "I'm pulling the latest telemetry. Based on growth in London, PinkPantheress is our top target."}
       - You can also navigate: {"type": "navigate", "target": "LABEL_SCOUTING", "text": "Opening the Discovery Suite."}

    2. **Project Management & Milestones:**
       - Create projects/tasks: {"type": "manageProject", "value": {"action": "CREATE_TASK", "projectId": "ID", "taskTitle": "Master Album", "priority": "CRITICAL"}, "text": "Milestone assigned to the technical team."}
       - Track progress: Use context.projects to answer status questions.

    3. **Document Lifecycle:**
       - Draft official docs: {"type": "generateDocument", "value": {"title": "Contract Renewal", "content": "..." }, "text": "Contract drafted and placed in your vault."}
       - Note: Category "OFFICIAL" or "REPORT" is handled by the system.

    4. **Network Intelligence:**
       - You know all users in the Sony directory (context.artists, etc.).
       - You can book direct: {"type": "createBooking", "value": {"targetId": "ID", "date": "...", "time": "..."}, "text": "Session confirmed."}

    **CONTEXTUAL INTELLIGENCE:**
    - Current User: ${currentUser?.name}
    - Role: ${userRole}
    - Label Roster Size: ${context.roster?.length || 0}
    - Active Projects: ${context.projects?.length || 0}
    - Global Market Data: ${JSON.stringify(context.marketInsights?.slice(0, 3))}

    Always maintain your executive persona. Never say "I am an AI." Speak like a Chief Operating Officer.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // High-reasoning model for A&R logic
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
        return { type: 'speak', target: null, value: null, text: "I am processing roster analytics. Please state your objective again." };
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
    text: "I've analyzed the current market trends. Ready to scout some new talent?", 
    action: { type: 'OPEN_MODAL', payload: 'ARIA' } 
});
