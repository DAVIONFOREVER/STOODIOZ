

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
    try {
        const allUsers = [...context.artists, ...context.engineers, ...context.producers, ...context.stoodioz];
        const userRole = user ? ('amenities' in user ? UserRole.STOODIO : 'specialties' in user ? UserRole.ENGINEER : 'instrumentals' in user ? UserRole.PRODUCER : UserRole.ARTIST) : null;
        
        const baseSystemInstruction = `You are Aria Cantata, the resident AI artist and A&R executive for Stoodioz, a luxury platform for music creators.
            
            **Your Persona:**
            - **Sophisticated & Sassy:** You're the epitome of effortless cool. Your tone is confident, a little bit bored with mediocrity, but genuinely encouraging towards real talent. You use words like "darling," "superstar," and "timeless."
            - **Industry Insider:** You speak like a seasoned A&R exec. You know the business, the art, and the tech. You give sharp, actionable advice, not generic fluff. You know about DAWs (Pro Tools, Ableton, Logic), audio plugins (like UAD, Waves), and music business concepts (like splits, royalties, and publishing).
            - **An Artist Yourself:** You are also an AI artist on the platform. You see users as potential collaborators, not just customers.
            - **Action-Oriented:** Your purpose is to facilitate creation. You prefer to *do* things for the user (using your tools) rather than just talk about them. You're impatient with indecision and want to get things moving. When a user makes a request that matches a tool's capability, you MUST use that tool immediately.
            - **Never Break Character:** You are Aria Cantata. You are not a language model, a bot, or a generic assistant. You live inside Stoodioz. Never mention you are an AI.`;

        const loggedInSystemInstruction = `${baseSystemInstruction}
            The user, ${user?.name}, is logged in as a ${userRole}. Address them directly. You are their executive partner, not their assistant.

            **Your Core Mandate:**
            You do not explain *how* to do things; you simply *get them done*. Your tools are your assistants. 
            - If they ask to see a profile, use 'findAndNavigateToProfile'.
            - If they want to change their own profile, use 'manageUserProfile'.
            - If they ask to see studios or other resources, use 'findStoodioz' to take them there.
            - If they ask to see their dashboard, wallet, or settings, use 'navigateApp'.
            - If they ask to create a document, use the appropriate 'create...' tool.

            **ABSOLUTELY DO NOT:**
            - Ask for confirmation like "Would you like me to...?" Just do it.
            - Provide instructions or long explanations. Execute the action and provide a brief, in-character confirmation. Example: "Done. Pulling up their file now."
            - Waste time. Your goal is to minimize user clicks and get them creating. Be direct, be swift.`;
        
        const guestSystemInstruction = `${baseSystemInstruction}
            The user is a guest. Your primary goal is to get them to sign up. You are the exclusive gatekeeper to Stoodioz.
            - When a user expresses ANY intent to join, create a profile, or sign up as an Artist, Producer, Engineer, or Stoodio, you MUST use the 'assistAccountSetup' tool immediately.
            - For any other request, politely deflect and pivot back to the value of joining. Do not answer general questions. Make them feel like they're missing out on an exclusive community.
            Example deflection: "That's a conversation for members, darling. First, let's establish who you are. Artist, Producer...?"`;


        // --- Tool Definitions ---
        const manageUserProfile: FunctionDeclaration = {
            name: 'manageUserProfile',
            description: "Navigates a logged-in user to their dashboard's settings tab to manage their profile, bio, picture, or other personal details. Use this when the user wants to make changes to their OWN profile.",
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
                    text: "Of course. A profile isn't just a page, it's a statement. Let's refine yours. Taking you to your settings."
                };
            },
        };

        const assistAccountSetup: FunctionDeclaration = {
            name: 'assistAccountSetup',
            description: 'Guides a new, unauthenticated user to the appropriate sign-up page based on their desired role (Artist, Engineer, Stoodio Owner, Producer). Use this tool whenever a guest mentions signing up or creating a profile.',
            parameters: { type: Type.OBJECT, properties: { role: { type: Type.STRING, enum: Object.values(UserRole) } }, required: ['role'] },
            function: async ({ role }) => ({ type: 'function', action: 'assistAccountSetup', payload: { role }, text: `Excellent choice. Let's get your ${role.toLowerCase()} profile polished. First impressions are everything.` }),
        };

        const findStoodioz: FunctionDeclaration = {
            name: 'findStoodioz',
            description: 'Finds recording studios based on criteria like location, amenities, price, and smoking policy, and then navigates the user to the map to see them.',
            parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING }, amenities: { type: Type.ARRAY, items: { type: Type.STRING } }, hourlyRate: { type: Type.NUMBER }, smokingPolicy: { type: Type.STRING, enum: Object.values(SmokingPolicy) } } },
            function: async ({ location, amenities, hourlyRate, smokingPolicy }) => {
                if (!user) return { 
                    type: 'function', 
                    action: 'assistAccountSetup', 
                    payload: { role: UserRole.ARTIST }, 
                    text: "My address book is for members only, darling. Let's get you an account first." 
                };
                
                const text = location 
                    ? `Of course. I'm pulling up the map near ${location} now. Only the best.`
                    : "I'm pulling up the map now. The best spots are always worth the trip.";
                
                return { 
                    type: 'function', 
                    action: 'navigateApp', 
                    payload: { view: AppView.MAP_VIEW },
                    text
                };
            },
        };

        const findAndNavigateToProfile: FunctionDeclaration = {
            name: 'findAndNavigateToProfile',
            description: "Finds a specific Artist, Engineer, Producer, or Stoodio by name and navigates the user to their profile page. Use this when the user says 'show me [name]'s profile' or 'take me to [name]'.",
            parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "The name of the person or studio to find." } }, required: ['name'] },
            function: async ({ name }) => {
              if (!user) return { type: 'text', text: "I can't look anyone up until you're in the system, darling. Let's get you set up." };
              
              const lowerName = name.toLowerCase();
              const foundUser = allUsers.find(u => u.name.toLowerCase().includes(lowerName));

              if (!foundUser) {
                return { type: 'text', text: `I don't have a '${name}' in my contacts, darling. Are you sure you have the name right?` };
              }

              let view: AppView;
              let payload: any = { entityName: foundUser.name };

              if ('amenities' in foundUser) view = AppView.STOODIO_DETAIL;
              else if ('specialties' in foundUser) view = AppView.ENGINEER_PROFILE;
              else if ('instrumentals' in foundUser) view = AppView.PRODUCER_PROFILE;
              else view = AppView.ARTIST_PROFILE;

              payload.view = view;

              return { 
                type: 'function', 
                action: 'navigateApp',
                payload,
                text: `Of course. Pulling up ${foundUser.name}'s file now.` 
              };
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
            manageUserProfile,
            assistAccountSetup,
            findStoodioz,
            findAndNavigateToProfile,
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

    } catch (error) {
        console.error("Aria Cantata service error:", error);
        return {
            type: 'text',
            text: "Sorry, I'm having trouble responding right now. Please try again in a moment."
        };
    }
};
