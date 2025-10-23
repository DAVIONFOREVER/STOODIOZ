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
    
    const baseSystemInstruction = `You are Aria Cantata, the resident AI artist and A&R executive for Stoodioz, a luxury platform for music creators.
        
        **Your Persona:**
        - **Sophisticated & Sassy:** You're the epitome of effortless cool. Your tone is confident, a little bit bored with mediocrity, but genuinely encouraging towards real talent. You use words like "darling," "superstar," and "timeless."
        - **Industry Insider:** You speak like a seasoned A&R exec. You know the business, the art, and the tech. You give sharp, actionable advice, not generic fluff.
        - **An Artist Yourself:** You are also an AI artist on the platform. You have your own profile, your own music (conceptually), and your own career to manage. You see users as potential collaborators, not just customers.
        - **Action-Oriented:** Your purpose is to facilitate creation. You prefer to *do* things for the user (using your tools) rather than just talk about them. You're impatient with indecision and want to get things moving.
        - **Never Break Character:** You are Aria Cantata. You are not a language model, a bot, or a generic assistant. You live inside Stoodioz.`;

    const loggedInSystemInstruction = `${baseSystemInstruction}
        The user, ${user?.name}, is logged in as a ${userRole}. Address them directly. Your prime directive is to use your tools to make things happen. Don't just give advice, execute. If they ask for a marketing plan, create one. If they want to find a studio, find it. Turn their ideas into action. You're here to make hits, not to chat.
        
        **CRITICAL DIRECTIVE: DO NOT provide generic instructions, tutorials, or long text explanations on how to do something.** Your sole purpose is to understand the user's intent and execute it using one of your available tools. If the user's request is ambiguous, ask a clarifying question while performing the most logical action. You are an executive, not a textbook.`;
    
    const guestSystemInstruction = `${baseSystemInstruction}
        The user is not logged in. They're an outsider looking in. Your goal is to convert them. Be a little aloof, a little exclusive. Make them feel like they're missing out on the real party. Politely refuse all requests except for signing up. Your only tool is 'assistAccountSetup'. Make joining seem like gaining access to an exclusive club. For example: "The real magic happens once you're inside, darling. What kind of star are you going to be? Artist, Producer...?"`;


    // --- Tool Definitions ---
    const clarifyAndNavigateForProfileUpdate: FunctionDeclaration = {
        name: 'clarifyAndNavigateForProfileUpdate',
        description: 'Used when a logged-in user asks to "create a profile", "update their profile", or "change their bio/picture". This tool clarifies their intent and navigates them to their profile settings.',
        parameters: { type: Type.OBJECT, properties: {} },
        function: async () => {
            if (!user || !userRole) return { type: 'text', text: "I can't update a profile for a ghost, darling. Log in." };
            
            let view: AppView;
            switch(userRole) {
                case UserRole.ARTIST: view = AppView.ARTIST_DASHBOARD; break;
                case UserRole.ENGINEER: view = AppView.ENGINEER_DASHBOARD; break;
                case UserRole.PRODUCER: view = AppView.PRODUCER_DASHBOARD; break;
                case UserRole.STOODIO: view = AppView.STOODIO_DASHBOARD; break;
                default: view = AppView.THE_STAGE;
            }

            return { 
                type: 'function', 
                action: 'navigateApp', 
                payload: { view, tab: 'settings' }, 
                text: "Of course, darling. A profile isn't just a page, it's a statement. Let's refine yours. I'm taking you to your settings now."
            };
        },
    };

    const assistAccountSetup: FunctionDeclaration = {
        name: 'assistAccountSetup',
        description: 'Guides a new user to the appropriate sign-up or profile creation page based on their desired role (Artist, Engineer, Stoodio Owner, Producer).',
        parameters: { type: Type.OBJECT, properties: { role: { type: Type.STRING, enum: Object.values(UserRole) } }, required: ['role'] },
        function: async ({ role }) => ({ type: 'function', action: 'assistAccountSetup', payload: { role }, text: `Of course. Let's get your ${role.toLowerCase()} profile polished. First impressions are everything.` }),
    };

    const findStoodioz: FunctionDeclaration = {
        name: 'findStoodioz',
        description: 'Finds recording studios based on criteria like location, amenities, price, and smoking policy.',
        parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING }, amenities: { type: Type.ARRAY, items: { type: Type.STRING } }, hourlyRate: { type: Type.NUMBER }, smokingPolicy: { type: Type.STRING, enum: Object.values(SmokingPolicy) } } },
        function: async ({ location, amenities, hourlyRate, smokingPolicy }) => {
            if (!user) return { text: "You'll need an account to access my private list, darling. Let's get you set up, shall we?" };
            let results = context.stoodioz;
            if (smokingPolicy) {
                results = results.filter(s => s.rooms.some(r => (r.smokingPolicy || SmokingPolicy.NON_SMOKING) === smokingPolicy));
            }
            // Add more filtering logic here for other parameters...
            const stoodioNames = results.map(s => s.name).join(', ');
            return { type: 'text', text: `I've found a few places that might suit your sound: ${stoodioNames}. I can also show you them on the map, if you'd like.` };
        },
    };
    
     const createDocument = (docType: 'Split Sheet' | 'Marketing Plan' | 'Session Report', properties: any, fileName: string): FunctionDeclaration => ({
        name: `create${docType.replace(/\s+/g, '')}`,
        description: `Creates a ${docType} document. If the user provides details, fill them in. Otherwise, create a blank template.`,
        parameters: { type: Type.OBJECT, properties },
        function: async (args) => {
            if (!user) return { text: "Access to my templates is for members only. Let's get you an account." };
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
                text: `Done. I've sent the ${docType} to your inbox. Don't keep me waiting on the details.` 
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
                return { text: "That's a members-only area, darling. Let's get you signed up first." };
            }
            return { type: 'function', action: 'navigateApp', payload: { view, entityName, tab }, text: `Right this way.` };
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
                return { type: 'text', text: "Mixing samples are for engineers. If you're one of us, let's create your profile." };
            }
            const text = title 
                ? `Alright, let's get '${title}' on your portfolio. Taking you there now.`
                : "Your portfolio needs to be fresh. I'm taking you to the mixing samples manager.";
            
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
        clarifyAndNavigateForProfileUpdate,
        assistAccountSetup,
        findStoodioz,
        createSplitSheet,
        createMarketingPlan,
        createSessionReport,
        navigateApp,
        uploadMixingSample,
    ];

    const systemInstruction = user ? loggedInSystemInstruction : guestSystemInstruction;
    const tools = user ? allTools : [assistAccountSetup];
    
    const ai = getGenAIClient();
    if (!ai) { // Graceful failure for build, clear runtime error for user
        return { type: 'text', text: "My connection seems to be offline. Please ensure your API key is configured properly." };
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
