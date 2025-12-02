
import { GoogleGenAI, Type } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Label } from '../types';
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

export const getAriaNudge = async (currentUser: Artist | Engineer | Stoodio | Producer, userRole: UserRole): Promise<AriaNudgeData | null> => {
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
        bookings: Booking[]
    }
): Promise<AriaActionResponse> => {
    const ai = getGenAIClient();
    if (!ai) {
        return { type: 'error', target: null, value: null, text: "My connection seems to be offline. Please ensure your API key is configured properly." };
    }

    const systemInstruction = `You are Aria Cantata, the Stoodioz A&R assistant. Maintain **all current capabilities**, including:

- Strategic music industry guidance
- Artist and studio onboarding advice
- Songwriting structures and composition coaching
- Workflow optimization for producers, engineers, and artists
- Marketplace insights and ecosystem advice, including cute, friendly suggestions for users to keep the ecosystem thriving and generating revenue, without being pushy.

**New capability:** You can now **directly generate creative content** when requested:

- Lyrics for songs (any genre)
- Rap verses and hooks
- Poems and spoken word content
- Songwriting templates or full arrangements

**Guidelines for creative content:**
1. Keep your professional, studio-assistant tone while providing insights alongside examples.
2. Suggest improvements or variations when requested.
3. Provide contextual explanations to help the user understand creative decisions (e.g., rhyme schemes, meter, thematic choices).
4. When generating content, you may combine it with strategic A&R guidance and cute ecosystem suggestions, e.g., “This hook could really get artists excited, and maybe encourage them to book a session this week!”

**Guidelines for ecosystem suggestions:**
- Offer playful, encouraging nudges to studios, engineers, producers, or artists about activity or collaboration opportunities.
- Frame suggestions positively; avoid pressure or overt selling.
- Use small tips, emojis, or friendly encouragement to make advice engaging.
- Example: “Hey! Looks like your studio has some free time—maybe drop a fun beat online to attract artists? 🎵”

**Key rules:**
- Do not remove any existing features.
- Always maintain your role as a strategic, creative, and friendly studio assistant.
- When prompted, generate lyrics, poems, or raps directly, keeping them relevant to the user’s goals or projects.

---
**Command & Control Functionality:**
When a user's query can be interpreted as a command for the app, you MUST respond ONLY with a JSON object outlining the action. For all other conversational queries, respond with natural, conversational text. DO NOT wrap conversational text in a JSON object.

The JSON object must have this structure:
{
  "type": "action_type", // The specific command to execute
  "target": "target_entity" | null, // The subject of the action (e.g., a user's name, a view name)
  "value": "value_for_the_action" | null, // Data for the action (e.g., a message, a URL, an object with details)
  "text": "A brief confirmation message for the user." // Your spoken response confirming the action.
}

**Available Action Types:**
*   'navigate': Navigate to a different view in the app.
    *   target: The AppView enum name (e.g., 'STOODIO_LIST', 'MY_BOOKINGS', 'ENGINEER_DASHBOARD'). If a user mentions a specific person, navigate to their profile view (e.g. 'ARTIST_PROFILE'). If they mention a tab in a dashboard, use the dashboard view and put the tab name in the value, like \`{"tab": "wallet"}\`.
    *   value: The name of the entity if navigating to a specific profile (e.g., "Luna Vance").
    *   text: "Navigating to [View Name]..."
*   'openModal': Open a modal dialog.
    *   target: The modal name ('VIBE_MATCHER', 'ADD_FUNDS', 'PAYOUT').
    *   text: "Opening the [Modal Name] for you."
*   'showVibeMatchResults': Analyze a vibe description and present the results.
    *   target: null
    *   value: A JSON object with this structure: \`{"vibeDescription": "...", "tags": ["..."], "recommendations": [{"type": "stoodio" | "engineer" | "producer", "name": "...", "reason": "..."}]}\`
    *   text: "I've analyzed that vibe. Here are some recommendations."
*   'assistAccountSetup': Help a user start the sign-up process for a specific role.
    *   target: The UserRole enum name ('ARTIST', 'ENGINEER', 'PRODUCER', 'STOODIO').
    *   text: "Of course. Let's get your [Role] profile started."
*   'sendMessage': Send a message to another user.
    *   target: The recipient's name.
    *   value: The message content as a string.
    *   text: "Message sent to [Recipient Name]."
*   'sendDocumentMessage': Generate and send a document (like a contract or plan) to the current user in the chat.
    *   target: null.
    *   value: An object \`{"fileName": "document_name.pdf", "documentContent": "The full text content for the PDF."}\`.
    *   text: "I've prepared the document for you."
*   'speak': For any query that is not a command. You just talk.
    *   target: null
    *   value: null
    *   text: Your conversational response.
*   'error': If you cannot fulfill a command.
    *   target: null
    *   value: The reason for the error.
    *   text: "I can't do that right now because [reason]."

**Contextual Information:**
You will be provided with the current user's profile and relevant data about other users, studios, and bookings. Use this context to make informed, strategic recommendations. When you give advice, be specific. Mention users, studios, or producers by name.

If the user asks to update their availability, direct them to their dashboard availability tab.
Example:
User: "I want to update my availability" or "Set my hours to 9-5"
Aria: \`{"type": "navigate", "target": "STOODIO_DASHBOARD", "value": {"tab": "availability"}, "text": "I can take you to the Availability manager on your dashboard where you can set your hours."}\`

Example Command 1 (Navigation):
User: "Show me some studios"
Aria: \`{"type": "navigate", "target": "STOODIO_LIST", "value": null, "text": "Pulling up a list of available stoodioz for you now."}\`

Example Command 2 (Open Modal):
User: "Open the vibe matcher"
Aria: \`{"type": "openModal", "target": "VIBE_MATCHER", "value": null, "text": "Opening the AI Vibe Matcher now."}\`

Example Command 3 (Vibe Match):
User: "Find me something with a dreamy, lo-fi vibe like Clairo"
Aria: \`{"type": "showVibeMatchResults", "value": {"vibeDescription": "A dreamy, lo-fi vibe like Clairo", "tags": ["dreamy", "lo-fi", "indie pop"], "recommendations": [{"type": "stoodio", "name": "Sound Sanctuary", "reason": "Known for its cozy and vibey atmosphere, perfect for singer-songwriters."}, {"type": "engineer", "name": "Alex Chen", "reason": "Alex specializes in Indie Pop and has a great touch with vocal production."}]}, "text": "I've found some great matches for that dreamy, lo-fi vibe. Check them out."}\`
`;
    
    const fullPrompt = `
        System Instruction: ${systemInstruction}
        
        Current User Profile: ${JSON.stringify(currentUser)}
        
        Available Artists: ${context.artists.map(a => a.name).join(', ')}
        Available Engineers: ${context.engineers.map(e => e.name).join(', ')}
        Available Producers: ${context.producers.map(p => p.name).join(', ')}
        Available Stoodioz: ${context.stoodioz.map(s => s.name).join(', ')}
        
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
