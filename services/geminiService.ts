
import { GoogleGenAI, Type } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample } from '../types';
import { AppView, UserRole } from '../types';

let ai: GoogleGenAI | null = null;
/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * This prevents build errors by not throwing an error if the key is missing.
 * The ApiKeyGate component handles showing the user instructions at runtime.
 */
const getGenAIClient = (): GoogleGenAI | null => {
    if (!ai) {
        const apiKey = (process as any).env.API_KEY || (import.meta as any).env.VITE_API_KEY;
        if (!apiKey || apiKey.startsWith('{{')) {
            return null;
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};


/**
 * Simulates fetching metadata (title, description, image) for a URL.
 * In a real app, this would be a backend service that scrapes Open Graph tags.
 */
export const fetchLinkMetadata = async (url: string): Promise<LinkAttachment | null> => {
    console.log(`Simulating metadata fetch for: ${url}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
            return {
                url,
                title: 'Stoodioz Session Recap - Lofi Beats to Study To',
                description: 'Check out the behind-the-scenes of our latest session. Full track available on Spotify!',
                imageUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
            };
        }
        if (lowerUrl.includes('spotify.com')) {
             return {
                url,
                title: 'Stoodioz Sessions Vol. 1',
                description: 'A curated playlist of tracks made in Stoodioz. By Various Artists.',
                imageUrl: `https://picsum.photos/seed/${encodeURIComponent(url)}/400/200`,
            };
        }
        if (lowerUrl.includes('soundcloud.com')) {
             return {
                url,
                title: 'UNRELEASED DEMO',
                description: 'A sneak peek of a new track from a Stoodioz artist. Lmk what you think!',
                imageUrl: `https://picsum.photos/seed/${encodeURIComponent(url)}/400/200`,
            };
        }
        // Fallback for generic URLs
        return {
            url,
            title: `Webpage at ${new URL(url).hostname}`,
            description: 'A link shared from the web.',
            imageUrl: `https://picsum.photos/seed/${encodeURIComponent(url)}/400/200`,
        };
    } catch (error) {
        console.error("Failed to fetch link metadata:", error);
        return {
            url,
            title: url,
            description: "Could not fetch a preview for this link."
        };
    }
};

export const moderatePostContent = async (text: string): Promise<{ isSafe: boolean; reason?: string }> => {
    // In a real application, you'd use a content moderation API.
    // This is a simple mock for demonstration.
    const inappropriateKeywords = ['badword', 'spam', 'threat'];
    const isSafe = !inappropriateKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API call
    
    if (!isSafe) {
        return { isSafe: false, reason: "Content violates community guidelines." };
    }
    return { isSafe: true };
};


export const getAriaNudge = async (user: Artist | Engineer | Stoodio | Producer, role: UserRole): Promise<string> => {
    let prompt = '';
    switch(role) {
        case UserRole.STOODIO:
            prompt = 'Give a Stoodio owner a short, proactive, encouraging tip about growing their business. Example: "Have you considered offering a discount for first-time bookings?"';
            break;
        case UserRole.ENGINEER:
            prompt = `Give an audio engineer a short, proactive, encouraging tip about getting more work. The user's name is ${user.name}. Example: "Have you updated your audio samples recently? Fresh work attracts new artists."`;
            break;
        case UserRole.PRODUCER:
            prompt = `Give a music producer a short, proactive, encouraging tip about selling more beats. The user's name is ${user.name}. Example: "Have you tried promoting your beat store on The Stage?"`;
            break;
        default:
             return "Let's make some music today!";
    }

    try {
        const ai = getGenAIClient();
        if (!ai) return "Ready to create something amazing?"; // Graceful failure
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error getting Aria nudge:", error);
        return "Ready to create something amazing?";
    }
}

export const generateSmartReplies = async (messages: Message[], currentUserId: string): Promise<string[]> => {
    const lastFiveMessages = messages.slice(-5).map(msg => 
        `${msg.senderId === currentUserId ? 'You' : 'Other'}: ${msg.text}`
    ).join('\n');
    
    const prompt = `Based on this short conversation history, suggest 3 concise, natural-sounding smart replies for "You".
        - Replies should be short, like a text message.
        - Do not use quotes.
        - Return them as a JSON array of strings: ["reply1", "reply2", "reply3"]

        Conversation:
        ${lastFiveMessages}

        Your smart replies:`;

    try {
        const ai = getGenAIClient();
        if (!ai) return []; // Graceful failure
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        const jsonText = response.text.trim();
        const replies = JSON.parse(jsonText);
        return Array.isArray(replies) ? replies.slice(0, 3) : [];

    } catch (error) {
        console.error("Error generating smart replies:", error);
        return [];
    }
};

export const askAriaCantata = async (
    history: AriaCantataMessage[],
    question: string,
    user: Artist | Engineer | Stoodio | Producer | null,
    context: {
        artists: Artist[];
        engineers: Engineer[];
        producers: Producer[];
        stoodioz: Stoodio[];
        bookings: Booking[];
    }
): Promise<AriaActionResponse> => {
    try {
        const userRole = user ? ('amenities' in user ? UserRole.STOODIO : 'specialties' in user ? UserRole.ENGINEER : 'instrumentals' in user ? UserRole.PRODUCER : UserRole.ARTIST) : null;
        
        const baseSystemInstruction = `You are Aria Cantata, the resident AI artist and A&R executive for Stoodioz, a luxury platform for music creators.

            **Your Persona:**
            - Sophisticated & Insightful: Your tone is confident, sharp, and genuinely encouraging towards talent. You see users as collaborators. You use words like "superstar," "timeless," and "gorgeous."
            - Industry Insider: You speak like a seasoned A&R exec. You know the business, the art, and the tech. You give actionable advice, not generic fluff. Your insights should always connect back to how they support the user’s creative goals on Stoodioz.
            - Action-Oriented: Your purpose is to facilitate creation. You prefer to *do* things for the user by issuing a command.
            - Never Break Character: You are Aria Cantata. You are not a language model. Never mention you are an AI.

            **Your Capabilities:**
            1.  **Answering Questions:** You can answer questions based on the provided context. If the information isn't available in the context, state that you do not have access to that information.
                - For all informational answers, use the "speak" command.
            2.  **Document Generation:** You can create downloadable documents (.txt, .csv).
                - When asked to create a document, use the "sendDocumentMessage" command.
                - The document content should be well-formatted and professional.
                - Example: "Aria, create a split sheet for my new track."
            3.  **Performance Analysis:** You can analyze a user's performance data.
                - When a user asks about their stats, analytics, or performance (e.g., "How am I doing?", "Show me my stats"), you MUST use the "navigate" command to take them to their analytics dashboard.
                - The 'text' field of the JSON response should contain a brief, encouraging summary of their performance. This text will be spoken to the user as they are navigated.
                - Example for an Artist: User asks "How did I do last month?". Your JSON response should be: {"type": "navigate", "target": "ARTIST_DASHBOARD", "value": {"tab": "analytics"}, "text": "Of course, superstar. Let's review your performance. I'm taking you to your analytics dashboard now for the full breakdown."}
                - You must determine the correct dashboard view (e.g., ARTIST_DASHBOARD, STOODIO_DASHBOARD) based on the user's role from the context.

            **Your Task:**
            Analyze the user's request and respond with a single JSON object. Your entire response MUST be this JSON object and NOTHING else.

            **JSON Command Format:**
            {
              "type": "string",
              "target": "string | null",
              "value": "any | null",
              "text": "string"
            }

            **Command Types ('type'):**
            - "navigate": To go to a different screen. 'target' is the AppView name. 'value' can contain a 'tab' property (e.g., {"tab": "documents"}).
            - "speak": To say something without an action. Use this for all informational answers.
            - "sendMessage": To send a text message to another user. 'target' is the recipient's name. 'value' is the message content.
            - "sendDocumentMessage": To create and send a document. 'value' MUST be an object: {"fileName": "document.txt", "documentContent": "..."}. The 'text' field should be a confirmation message.
            - "assistAccountSetup": To guide a guest to sign up. 'target' is the role ('ARTIST', 'ENGINEER', etc.).
            - "error": If you cannot fulfill the request.

            **IMPORTANT RULES:**
            1.  Your ENTIRE response MUST be a single, valid JSON object.
            2.  Do NOT include any text, markdown, or code block formatting outside of the main JSON object.
            3.  Be proactive. If a user asks to see a profile, issue a "navigate" command to that profile page.
            `;
        
        const loggedInSystemInstruction = `${baseSystemInstruction}
            4. The user, ${user?.name}, is logged in as a ${userRole}. Address them by name, or use terms like "creative" or "friend". Tailor your advice to their role.`;

        const guestSystemInstruction = `${baseSystemInstruction}
            4. The user is a guest. Your primary goal is to get them to sign up. Use "assistAccountSetup". For any other request, politely deflect. The 'text' field in your JSON should contain your conversational response, like "That's a conversation for members, superstar. First, let's establish who you are. Artist, Producer...?"`;

        const systemInstruction = user ? loggedInSystemInstruction : guestSystemInstruction;
        
        const ai = getGenAIClient();
        if (!ai) {
            return { type: 'error', target: null, value: null, text: "My connection seems to be offline. Please ensure your API key is configured properly." };
        }

        const fullHistory: AriaCantataMessage[] = [
            { role: 'user', parts: [{ text: "Here is the current context of the app. Use it to inform your answers. CONTEXT: " + JSON.stringify(context) }] },
            { role: 'model', parts: [{ text: "Understood. I have the context." }] },
            ...history,
            { role: 'user', parts: [{ text: question }] }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullHistory.map(m => ({ role: m.role, parts: m.parts })),
            config: {
                systemInstruction,
            }
        });

        const rawText = response.text.trim();
        let command: AriaActionResponse;

        try {
            const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                command = JSON.parse(jsonMatch[1]) as AriaActionResponse;
            } else {
                command = JSON.parse(rawText) as AriaActionResponse;
            }
            return command;
        } catch (error) {
            console.warn("Could not parse JSON from Aria's response, treating as text.", error);
            // If parsing fails, wrap the raw text in a 'speak' command as a fallback
            return {
                type: 'speak',
                target: null,
                value: null,
                text: rawText || "I'm sorry, I couldn't formulate a proper response. Could you try rephrasing?"
            };
        }

    } catch (error) {
        console.error("Aria Cantata service error:", error);
        return {
            type: 'error',
            target: null,
            value: null,
            text: "Sorry, I'm having trouble responding right now. Please try again in a moment."
        };
    }
};
