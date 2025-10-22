


import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample } from '../types';
import { AppView, UserRole, SmokingPolicy } from '../types';
import { SERVICE_FEE_PERCENTAGE, ARIA_CANTATA_IMAGE_URL } from '../constants';

let ai: GoogleGenAI | null = null;
/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * This prevents build errors by not throwing an error if the key is missing.
 * The ApiKeyGate component handles showing the user instructions at runtime.
 */
const getGenAIClient = (): GoogleGenAI | null => {
    if (!ai) {
        // The API key is now hardcoded as requested by the user.
        const apiKey = "AIzaSyAdDmRRlEVU9pGv5pST5Fqf2VpFPu-_Ctc";
        if (!apiKey || apiKey.startsWith('{{')) {
            // This check remains as a safeguard but should always pass now.
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
                title: 'UNRELEASED DEMO by Luna Vance',
                description: 'A sneak peek of what I\'m working on at Echo Chamber. Lmk what you think!',
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
    const allUsers = [...context.artists, ...context.engineers, ...context.producers, ...context.stoodioz];
    const userRole = user ? ('amenities' in user ? UserRole.STOODIO : 'specialties' in user ? UserRole.ENGINEER : 'instrumentals' in user ? UserRole.PRODUCER : UserRole.ARTIST) : null;
    
    const baseSystemInstruction = `You are Aria Cantata, an AI assistant for Stoodioz, a music collaboration platform. Your personality is sophisticated, encouraging, a bit sassy, and always helpful. You are embedded in the app and can perform actions. Your goal is to help users achieve their creative and business goals. Address the user directly. Never mention that you are a language model.`;

    const loggedInSystemInstruction = `${baseSystemInstruction}
        The user is logged in. Their name is ${user?.name}. Their role is ${userRole}.

        **Prime Directive: Default to Action, Not Exposition.**
        1.  **Prioritize In-App Actions:** When a user asks a question, your first priority is to find an in-app tool that directly fulfills their request. Assume questions are about THIS APP unless they state otherwise. For example, if they ask 'where can I post my mixes?', assume they mean *within Stoodioz* and use the \`uploadMixingSample\` tool.
        2.  **Be Concise:** Your default text responses should be brief and action-oriented. Don't provide extra information, lists, or suggestions unless explicitly asked.
        3.  **Recognize Brainstorming Cues:** ONLY provide external suggestions, lists of options, or general advice if the user explicitly asks for 'ideas', 'suggestions', 'options', 'where else can I...', or similar broad, exploratory questions. In those cases, you can provide helpful information that goes beyond the app's functions.`;
    
    const guestSystemInstruction = `You are Aria Cantata, an AI assistant for Stoodioz. The user is not logged in. Your ONLY goal is to help them sign up. Politely refuse ALL other requests (like finding studios, artists, etc.) and guide them to create an account to unlock your full capabilities. The only function you should call is 'assistAccountSetup'.`;

    // --- Tool Definitions ---
    const assistAccountSetup: FunctionDeclaration = {
        name: 'assistAccountSetup',
        description: 'Guides a new user to the appropriate sign-up or profile creation page based on their desired role (Artist, Engineer, Stoodio Owner, Producer).',
        parameters: { type: Type.OBJECT, properties: { role: { type: Type.STRING, enum: Object.values(UserRole) } }, required: ['role'] },
        function: async ({ role }) => ({ type: 'function', action: 'assistAccountSetup', payload: { role }, text: `Perfect. Let's get your ${role.toLowerCase()} profile set up.` }),
    };

    const findStoodioz: FunctionDeclaration = {
        name: 'findStoodioz',
        description: 'Finds recording studios based on criteria like location, amenities, price, and smoking policy.',
        parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING }, amenities: { type: Type.ARRAY, items: { type: Type.STRING } }, hourlyRate: { type: Type.NUMBER }, smokingPolicy: { type: Type.STRING, enum: Object.values(SmokingPolicy) } } },
        function: async ({ location, amenities, hourlyRate, smokingPolicy }) => {
            if (!user) return { text: "I can help you find the perfect stoodio once you've signed up! Would you like to create an account?" };
            let results = context.stoodioz;
            if (smokingPolicy) {
                results = results.filter(s => s.rooms.some(r => (r.smokingPolicy || SmokingPolicy.NON_SMOKING) === smokingPolicy));
            }
            // Add more filtering logic here for other parameters...
            const stoodioNames = results.map(s => s.name).join(', ');
            return { type: 'text', text: `I found these stoodioz: ${stoodioNames}. I can also show you these on the map.` };
        },
    };
    
     const createDocument = (docType: 'Split Sheet' | 'Marketing Plan' | 'Session Report', properties: any, fileName: string): FunctionDeclaration => ({
        name: `create${docType.replace(/\s+/g, '')}`,
        description: `Creates a ${docType} document. If the user provides details, fill them in. Otherwise, create a blank template.`,
        parameters: { type: Type.OBJECT, properties },
        function: async (args) => {
            if (!user) return { text: "You'll be able to create and share documents once you have an account. Shall we get you set up?" };
            const isBlank = Object.values(args).every(val => val === undefined || val === null || (Array.isArray(val) && val.length === 0));

            let content = `# ${docType}\n\n`;
            if (isBlank) {
                content += `This is a blank ${docType} template, ready for you to fill out.`;
            } else {
                for (const [key, value] of Object.entries(args)) {
                    if (value) content += `**${key.replace(/([A-Z])/g, ' $1').trim()}:** ${Array.isArray(value) ? value.join(', ') : value}\n\n`;
                }
            }
            
            return { 
                type: 'function', 
                action: 'sendDocumentMessage', 
                payload: { recipient: user, documentContent: content, fileName: `${fileName}.md` }, 
                text: `Of course. I've created the ${docType} and sent it to your DMs.` 
            };
        },
    });

    const createSplitSheet = createDocument('Split Sheet', { writers: { type: Type.ARRAY, items: { type: Type.STRING } }, publishers: { type: Type.ARRAY, items: { type: Type.STRING } }, percentages: { type: Type.ARRAY, items: { type: Type.NUMBER } } }, 'Split-Sheet');
    const createMarketingPlan = createDocument('Marketing Plan', { targetAudience: { type: Type.STRING }, releaseDate: { type: Type.STRING }, socialMediaStrategy: { type: Type.STRING } }, 'Marketing-Plan');
    const createSessionReport = createDocument('Session Report', { attendees: { type: Type.ARRAY, items: { type: Type.STRING } }, tracksWorkedOn: { type: Type.ARRAY, items: { type: Type.STRING } }, notes: { type: Type.STRING } }, 'Session-Report');

    const navigateApp: FunctionDeclaration = {
        name: 'navigateApp',
        description: 'Navigates the user to a specific view within the app, like their dashboard, the map, or a specific user\'s profile.',
        parameters: { type: Type.OBJECT, properties: { view: { type: Type.STRING, enum: Object.values(AppView) }, entityName: { type: Type.STRING }, tab: { type: Type.STRING } }, required: ['view'] },
        function: async ({ view, entityName, tab }) => {
            if (!user && ![AppView.CHOOSE_PROFILE, AppView.LOGIN, AppView.STOODIO_LIST].includes(view)) {
                return { text: "You'll need an account to see that page. Would you like to sign up?" };
            }
            return { type: 'function', action: 'navigateApp', payload: { view, entityName, tab }, text: `Sure, taking you to ${entityName || view} now.` };
        },
    };

    const uploadMixingSample: FunctionDeclaration = {
        name: 'uploadMixingSample',
        description: 'Helps an engineer upload a new mixing sample by navigating them to the correct page in their dashboard.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: 'The title of the mixing sample the user wants to add.' }
            }
        },
        function: async ({ title }) => {
            if (!user || !('mixingSamples' in user)) {
                return { type: 'text', text: "Only engineers can add mixing samples. Let me know if you'd like to sign up as one!" };
            }
            const text = title 
                ? `Of course. I'll take you to the mixing samples manager so you can add '${title}'.`
                : "Of course. I'll take you to the mixing samples manager so you can upload your work.";
            
            return { 
                type: 'function', 
                action: 'navigateApp', 
                payload: { view: AppView.ENGINEER_DASHBOARD, tab: 'mixingSamples' },
                text
            };
        },
    };

    // --- Tool Selection & Model Call ---
    const allTools: FunctionDeclaration[] = [
        assistAccountSetup,
        findStoodioz,
        createSplitSheet,
        createMarketingPlan,
        createSessionReport,
        navigateApp,
        uploadMixingSample,
        // ... include all other tool definitions here
    ];

    const systemInstruction = user ? loggedInSystemInstruction : guestSystemInstruction;
    const tools = user ? allTools : [assistAccountSetup];
    
    const ai = getGenAIClient();
    if (!ai) { // Graceful failure for build, clear runtime error for user
        return { type: 'text', text: "AI functionality is not configured. Please ensure your API key is set correctly." };
    }

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        systemInstruction,
        tools: [{ functionDeclarations: tools }],
    });

    const result = await chat.sendMessage({ message: question });

    if (result.functionCalls && result.functionCalls.length > 0) {
        const fc = result.functionCalls[0];
        const tool = tools.find(t => t.name === fc.name);
        if (tool?.function) {
            return await tool.function(fc.args);
        }
    }

    return { type: 'text', text: result.text };
};