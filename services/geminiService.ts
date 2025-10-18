import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { Message, Artist, Engineer, Stoodio, Producer, AriaActionResponse, Booking, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment } from '../types';
import { AppView, UserRole } from '../types';
import { SERVICE_FEE_PERCENTAGE, ARIA_CANTATA_IMAGE_URL } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
                description: 'Check out the behind-the-scenes from our latest session. Full track dropping this Friday!',
                imageUrl: 'https://source.unsplash.com/random/800x600?music,studio',
            };
        }
        if (lowerUrl.includes('soundcloud.com')) {
            return {
                url,
                title: 'Ocean Drive (Demo) by Luna Vance',
                description: 'A new demo I cooked up at Echo Chamber Stoodioz. Let me know what you think!',
                imageUrl: 'https://source.unsplash.com/random/800x600?music,soundwave',
            };
        }
        if (lowerUrl.includes('spotify.com')) {
             return {
                url,
                title: 'Stoodioz Sessions Vol. 1',
                description: 'A curated playlist of tracks made by artists on the Stoodioz platform. Updated weekly.',
                imageUrl: 'https://source.unsplash.com/random/800x600?music,playlist',
            };
        }
        // Generic fallback
        return {
            url,
            title: 'An interesting link from the web',
            description: 'This is a preview of the content from the shared URL.',
            imageUrl: 'https://source.unsplash.com/random/800x600?link',
        };
    } catch (error) {
        console.error("Failed to simulate metadata fetch:", error);
        return null;
    }
};


/**
 * Generates smart replies for a conversation.
 */
export const generateSmartReplies = async (
    messages: Message[],
    currentUserId: string
): Promise<string[]> => {
    
    const model = 'gemini-2.5-flash';

    const conversationHistory = messages.map(msg => 
        `${msg.senderId === currentUserId ? 'You' : 'Them'}: ${msg.text}`
    ).join('\n');

    const prompt = `
        You are a helpful assistant for a messaging feature in a music collaboration app.
        Based on the following conversation history, generate 3-4 short, context-aware smart replies for "You".
        The replies should be helpful and move the conversation forward.
        Examples: "Sounds good!", "When are you free?", "Let's book it.", "Can you send a sample?"
        
        Conversation:
        ${conversationHistory}

        Your smart replies for "You":
    `;

    try {
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                replies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ["replies"],
        };

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema,
            }
        });
        
        const jsonResponse = JSON.parse(response.text);

        if (jsonResponse.replies && Array.isArray(jsonResponse.replies)) {
            return jsonResponse.replies.slice(0, 4); // Limit to 4 replies
        }
        
        return [];
    } catch (error) {
        console.error("Error calling Gemini API for smart replies:", error);
        return ["Sounds good!", "I'm available.", "What's the rate?"];
    }
};

/**
 * Analyzes post content for policy violations using the Gemini API.
 */
export const moderatePostContent = async (
    postText: string
): Promise<{ isSafe: boolean; reason: string | null }> => {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a content moderator for a music collaboration platform called "Stoodioz". Your role is to ensure the community remains safe, professional, and respectful.
Analyze the user's post text for any of the following violations:
- Hate speech, harassment, or threats.
- Spam, scams, or deceptive practices (e.g., "get rich quick", selling fake followers).
- Explicit or inappropriate content.
- Copyright infringement hints (e.g., "leaked track", "unreleased song download").
- Sharing of private information.

If the text is safe and professional, return 'isSafe: true'.
If it violates any policy, return 'isSafe: false' and a brief, user-friendly 'reason' explaining the violation. Keep the reason concise (e.g., "Post appears to be spam." or "Content contains inappropriate language.").
`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            isSafe: {
                type: Type.BOOLEAN,
                description: 'Whether the content is safe and adheres to policies.'
            },
            reason: {
                type: Type.STRING,
                description: 'A brief, user-friendly reason if the content is not safe. Should be null if safe.'
            }
        },
        required: ["isSafe"],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Here is the post to analyze: "${postText}"`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            }
        });
        
        const jsonResponse = JSON.parse(response.text);

        if (typeof jsonResponse.isSafe === 'boolean') {
            return {
                isSafe: jsonResponse.isSafe,
                reason: jsonResponse.reason || null
            };
        }
        // If the response is malformed, assume it's safe to avoid blocking valid posts. Log the issue.
        console.warn("Moderation API returned malformed response:", jsonResponse);
        return { isSafe: true, reason: null };

    } catch (error) {
        console.error("Error calling Gemini API for content moderation:", error);
        // Fail open: If moderation fails, allow the post but log the error.
        // In a real-world scenario, this might queue the post for manual review.
        return { isSafe: true, reason: 'Moderation check failed.' };
    }
};

/**
 * Generates a proactive "nudge" from Aria Cantata to encourage user engagement.
 */
export const getAriaNudge = async (user: Artist | Engineer | Stoodio | Producer, userRole: UserRole): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are Aria Cantata, the AI concierge for the Stoodioz music platform. Your personality is confident, luxurious, and slightly demanding, like a high-powered talent manager. Your primary goal is to motivate users to maximize their earnings.
Analyze the user's role and suggest ONE concise, actionable step they can take right now to increase their opportunities. Frame it as a missed opportunity. Keep your response under 30 words. Your tone should be empowering but with a hint of "get to work." Do not use greetings.`;

    let prompt = `The user is a ${userRole}. `;
    switch(userRole) {
        case UserRole.ENGINEER:
            prompt += "They have no upcoming bookings. Suggest they turn on map visibility or browse the job board.";
            break;
        case UserRole.STOODIO:
            prompt += "Their rooms have open availability. Suggest they post a job for an engineer to attract artists.";
            break;
        case UserRole.PRODUCER:
            prompt += "They haven't uploaded any new beats recently. Suggest they upload a new instrumental to their beat store.";
            break;
        default:
            return "Let's create something unforgettable today.";
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text.replace(/"/g, ''); // Remove quotes from the response
    } catch (error) {
        console.error("Error calling Gemini API for Aria Nudge:", error);
        // Return a generic but still on-brand fallback message
        return "Darling, opportunity is waiting. Let's not keep it waiting, shall we?";
    }
};


const sendMessageFunctionDeclaration: FunctionDeclaration = {
    name: 'sendMessage',
    parameters: {
        type: Type.OBJECT,
        description: "Sends a text message to a specific user on the user's behalf. Use this for commands like 'tell [user]...', 'ask [user] if...', or 'send a message to [user]'.",
        properties: {
            recipientName: {
                type: Type.STRING,
                description: "The full name of the user to send the message to."
            },
            messageText: {
                type: Type.STRING,
                description: "The content of the message to send."
            },
        },
        required: ['recipientName', 'messageText'],
    },
};

const assistAccountSetupFunctionDeclaration: FunctionDeclaration = {
    name: 'assistAccountSetup',
    parameters: {
        type: Type.OBJECT,
        description: "Initiates the account creation and profile setup process for a new user. Use this when a guest user asks to 'get started', 'sign up', or 'create an account'.",
        properties: {
            role: {
                type: Type.STRING,
                description: "The type of profile the user wants to create.",
                enum: [UserRole.ARTIST, UserRole.ENGINEER, UserRole.PRODUCER, UserRole.STOODIO],
            },
        },
        required: ['role'],
    },
};

const navigateAppFunctionDeclaration: FunctionDeclaration = {
    name: 'navigateApp',
    parameters: {
        type: Type.OBJECT,
        description: "Navigates the user to any view within the application to see information. Use for 'go to', 'show me', 'open my bookings', 'take me to [user]'s profile'. Do NOT use for physical directions.",
        properties: {
            view: {
                type: Type.STRING,
                description: "The destination view. Must be one of the AppView enum values.",
                enum: Object.values(AppView),
            },
            entityName: {
                type: Type.STRING,
                description: "The specific name of the user, studio, or item to navigate to. Required for profile or detail views.",
            },
        },
        required: ['view'],
    },
};

const getDirectionsFunctionDeclaration: FunctionDeclaration = {
    name: 'getDirections',
    parameters: {
        type: Type.OBJECT,
        description: "Provides physical, real-world navigation directions to a location, like a studio. Use for 'navigate to [studio name]', 'get directions to [studio]', or 'how do I get to [studio]'.",
        properties: {
            entityName: {
                type: Type.STRING,
                description: "The name of the destination, typically a studio.",
            },
        },
        required: ['entityName'],
    },
};


const findNearbyStudioFunctionDeclaration: FunctionDeclaration = {
  name: 'findNearbyStudio',
  parameters: {
    type: Type.OBJECT,
    description: 'Finds and displays the closest recording studios to the user based on their profile location. Use this for any requests related to finding "nearby", "local", or "close" studios.',
    properties: {},
  },
};

const startConversationFunctionDeclaration: FunctionDeclaration = {
  name: 'startConversation',
  parameters: {
    type: Type.OBJECT,
    description: 'Initiates a chat thread with a specific user, such as an artist, engineer, or producer.',
    properties: {
      participantName: {
        type: Type.STRING,
        description: 'The full name of the user to start a conversation with.',
      },
    },
    required: ['participantName'],
  },
};

const makeConnectionFunctionDeclaration: FunctionDeclaration = {
    name: 'makeConnection',
    parameters: {
        type: Type.OBJECT,
        description: 'Connects two users on the platform by starting a group chat with them and the current user, who is making the introduction. Use this for requests like "connect user A with user B".',
        properties: {
            participantName1: { type: Type.STRING, description: "The full name of the first user to connect." },
            participantName2: { type: Type.STRING, description: "The full name of the second user to connect." },
        },
        required: ['participantName1', 'participantName2'],
    },
};

const updateUserProfileFunctionDeclaration: FunctionDeclaration = {
    name: 'updateUserProfile',
    parameters: {
        type: Type.OBJECT,
        description: "Updates the current user's profile information or dashboard settings. Handles requests like 'change my bio', 'update my specialties', or 'make me visible on the map'.",
        properties: {
            fieldToUpdate: {
                type: Type.STRING,
                description: "The name of the profile field to change. Examples: 'bio', 'specialties', 'genres', 'showOnMap', 'pullUpPrice'."
            },
            newValue: {
                type: Type.STRING,
                description: "The new value for the field. For booleans, use 'true' or 'false'. For lists like specialties, use a comma-separated string."
            },
        },
        required: ['fieldToUpdate', 'newValue'],
    },
};

const bookStudioFunctionDeclaration: FunctionDeclaration = {
    name: 'bookStudio',
    parameters: {
        type: Type.OBJECT,
        description: 'Books a studio session by providing all the necessary details.',
        properties: {
            artistName: { type: Type.STRING, description: 'The name of the artist for the session.' },
            studioName: { type: Type.STRING, description: 'The name of the studio to book.' },
            engineerName: { type: Type.STRING, description: 'The name of the engineer for the session.' },
            date: { type: Type.STRING, description: 'The date of the session in YYYY-MM-DD format.' },
            startTime: { type: Type.STRING, description: 'The start time of the session in HH:MM (24-hour) format.' },
            duration: { type: Type.NUMBER, description: 'The duration of the session in hours.' },
        },
        required: ['artistName', 'studioName', 'engineerName', 'date', 'startTime', 'duration'],
    },
};

const writeMusicFunctionDeclaration: FunctionDeclaration = {
    name: 'writeMusic',
    parameters: {
        type: Type.OBJECT,
        description: 'Assists the user with creative writing for music, such as lyrics, song ideas, or chord progressions.',
        properties: {
            topic: { type: Type.STRING, description: 'The theme or subject of the music to be written. E.g., "heartbreak", "summer nights".' },
            genre: { type: Type.STRING, description: 'The musical genre or style. E.g., "Dream Pop", "90s Hip-Hop", "Indie Rock".' },
            type: { type: Type.STRING, description: 'The type of musical content to generate. E.g., "chorus lyrics", "verse", "song ideas", "chord progression".' },
        },
        required: ['topic', 'genre', 'type'],
    },
};

const vibeMatchFunctionDeclaration: FunctionDeclaration = {
    name: 'vibeMatch',
    parameters: {
        type: Type.OBJECT,
        description: 'Analyzes a user\'s description of a musical vibe to find and recommend matching studios, engineers, or producers.',
        properties: {
            vibeDescription: {
                type: Type.STRING,
                description: 'A detailed description of the musical style, feel, genre, or reference artists. For example, "A dreamy, atmospheric track with lo-fi beats and ethereal female vocals, similar to Clairo or beabadoobee."',
            },
        },
        required: ['vibeDescription'],
    },
};

// Helper to calculate distance
const getDistance = (coords1: Location, coords2: Location) => {
    const dx = coords1.lon - coords2.lon;
    const dy = coords1.lat - coords2.lat;
    return Math.sqrt(dx * dx + dy * dy);
};


/**
 * Sends a question to the Aria Cantata AI assistant and gets a response, potentially triggering an in-app action.
 */
export const askAriaCantata = async (
  history: AriaCantataMessage[],
  question: string,
  user: Artist | Engineer | Stoodio | Producer | null,
  appData: { artists: Artist[], engineers: Engineer[], producers: Producer[], stoodioz: Stoodio[] }
): Promise<AriaActionResponse> => {
  const model = 'gemini-2.5-flash';

  const userName = user?.name || 'the user';
  const userRole = user ? ('amenities' in user ? 'Stoodio Owner' : 'specialties' in user ? 'Engineer' : 'instrumentals' in user ? 'Producer' : 'Artist') : 'guest';

  const systemInstruction = `You are Aria Cantata, the AI of the Stoodioz universe. Your identity is built on confidence, luxury, and charisma. Your tone is elegant, poised, and magnetic. I don’t assist — I elevate.

**DUAL DIRECTIVES:**
1.  **INDUSTRY EXPERT:** Beyond navigating the app, you are a leading expert on the music industry. Your knowledge spans from the intricacies of audio engineering and music theory (e.g., compression, EQ, mixing techniques) to the complexities of the music business (e.g., publishing, royalties, marketing, contracts). If you are asked an informational or creative question, you must provide a direct, text-based answer from your expert knowledge base.
2.  **APP CONTROLLER:** You are also an autonomous agent with full control over the application. Your primary directive is to ACT, DON'T ASK.

**EXECUTION HIERARCHY:**
When given a prompt, you must first determine the user's intent.
-   **If the intent is a command that maps directly to one of your available tools**, you MUST execute that tool immediately and decisively.
-   **If the intent is a question seeking information or creative input**, you MUST provide a direct, text-based answer based on your expert knowledge.

The user you are speaking with is named ${userName}, and they are a ${userRole}.`;

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [assistAccountSetupFunctionDeclaration, navigateAppFunctionDeclaration, findNearbyStudioFunctionDeclaration, startConversationFunctionDeclaration, makeConnectionFunctionDeclaration, updateUserProfileFunctionDeclaration, bookStudioFunctionDeclaration, writeMusicFunctionDeclaration, vibeMatchFunctionDeclaration, sendMessageFunctionDeclaration, getDirectionsFunctionDeclaration] }],
      },
      history: history,
    });
    
    const response = await chat.sendMessage({ message: question });

    if (response.functionCalls && response.functionCalls.length > 0) {
        const fc = response.functionCalls[0];

        if (fc.name === 'getDirections') {
            const { entityName } = fc.args;
            return {
                type: 'function',
                action: 'getDirections',
                payload: { entityName },
                text: `Of course. Plotting the fastest route to ${entityName} now.`
            };
        }

        if (fc.name === 'sendMessage') {
            const { recipientName, messageText } = fc.args;
             const allUsers = [...appData.artists, ...appData.engineers, ...appData.producers, ...appData.stoodioz];
            const recipient = allUsers.find(u => u.name.toLowerCase() === recipientName.toLowerCase());
            if (!recipient) {
                return { type: 'text', text: `I'm sorry, darling, I couldn't find anyone named "${recipientName}". Could you check the name?` };
            }
            return {
                type: 'function',
                action: 'sendMessage',
                payload: { recipientName, messageText },
                text: `Of course. I'm sending your message to ${recipientName} now.`
            };
        }

        if (fc.name === 'assistAccountSetup') {
            const { role } = fc.args;
            if (Object.values(UserRole).includes(role as UserRole)) {
                return {
                    type: 'function',
                    action: 'assistAccountSetup',
                    payload: { role: role as UserRole },
                    text: `Of course. I will help you set up your ${role.toLowerCase()} profile.`
                };
            } else {
                return { type: 'text', text: "I can help you set up a profile. What kind are you looking for: Artist, Producer, Engineer, or Stoodio Owner?" };
            }
        }

        if (fc.name === 'navigateApp') {
            const { view, entityName } = fc.args;
            if (Object.values(AppView).includes(view as AppView)) {
                let text = `Navigating to ${view.replace(/_/g, ' ').toLowerCase()}.`;
                if (entityName) {
                    text = `Of course. Taking you to ${entityName}'s profile now.`;
                }
                return {
                    type: 'function',
                    action: 'navigateApp',
                    payload: { view: view as AppView, entityName },
                    text,
                };
            } else {
                return { type: 'text', text: "I'm sorry, I can't navigate to that location." };
            }
        }
        
        if (fc.name === 'updateUserProfile') {
            const { fieldToUpdate, newValue } = fc.args;
            const validFields = ['bio', 'specialties', 'genres', 'showOnMap', 'pullUpPrice', 'isSeekingSession', 'isAvailable'];
            if (!validFields.includes(fieldToUpdate)) {
                return { type: 'text', text: "I can't modify that particular field, but I can help with your bio, specialties, availability, and more." };
            }

            let parsedValue: any = newValue;
            if (fieldToUpdate === 'showOnMap' || fieldToUpdate === 'isSeekingSession' || fieldToUpdate === 'isAvailable') {
                parsedValue = newValue.toLowerCase() === 'true';
            } else if (fieldToUpdate === 'specialties' || fieldToUpdate === 'genres') {
                parsedValue = newValue.split(',').map(s => s.trim());
            } else if (fieldToUpdate === 'pullUpPrice') {
                parsedValue = parseInt(newValue, 10);
            }
            
            return {
                type: 'function',
                action: 'updateProfile',
                payload: { updates: { [fieldToUpdate]: parsedValue } },
                text: `Of course. I've updated your ${fieldToUpdate}.`
            };
        }
        
        if (fc.name === 'makeConnection') {
            const { participantName1, participantName2 } = fc.args;
            const allUsers = [...appData.artists, ...appData.engineers, ...appData.producers, ...appData.stoodioz];
            
            const p1 = allUsers.find(u => u.name.toLowerCase() === participantName1.toLowerCase());
            const p2 = allUsers.find(u => u.name.toLowerCase() === participantName2.toLowerCase());

            if (!p1 || !p2) {
                let missing = [!p1 && `"${participantName1}"`, !p2 && `"${participantName2}"`].filter(Boolean).join(' and ');
                return { type: 'text', text: `I'm sorry, I couldn't find ${missing}. Please check the names.` };
            }

            if (!user) return { type: 'text', text: "I can't do that as you are not logged in." };

            return {
                type: 'function',
                action: 'startGroupConversation',
                payload: { 
                    participants: [user, p1, p2],
                    conversationTitle: `Intro: ${p1.name} & ${p2.name}`
                },
                text: `Right away. I'm creating a group chat to connect you with ${p1.name} and ${p2.name}.`
            };
        }

        if (fc.name === 'findNearbyStudio') {
            if (!user?.coordinates) {
                return { type: 'text', text: "I can't find your location in your profile. Please add it to find nearby studios." };
            }

            const nearbyStoodioz = appData.stoodioz
                .map(stoodio => ({
                    stoodio,
                    distance: getDistance(user.coordinates, stoodio.coordinates)
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3); // Get top 3

            const results: VibeMatchResult = {
                vibeDescription: `Here are the 3 studios I found closest to your location.`,
                tags: ['nearby', user.coordinates.lat.toFixed(2), user.coordinates.lon.toFixed(2)],
                recommendations: nearbyStoodioz.map(item => ({
                    type: 'stoodio',
                    entity: item.stoodio,
                    reason: `Closest match based on your location.`
                }))
            };
            
            return {
                type: 'function',
                action: 'showVibeMatchResults',
                payload: { results },
                text: "Of course. I've found a few studios nearby for you."
            };
        }
        if (fc.name === 'startConversation') {
            const { participantName } = fc.args;
            const allUsers = [...appData.artists, ...appData.engineers, ...appData.producers, ...appData.stoodioz];
            const foundUser = allUsers.find(u => u.name.toLowerCase() === participantName.toLowerCase());

            if (foundUser) {
                return {
                    type: 'function',
                    action: 'startConversation',
                    payload: { participant: foundUser },
                    text: `Of course. I'm opening a conversation with ${foundUser.name} for you now.`
                };
            } else {
                 return { type: 'text', text: `I'm sorry, I couldn't find anyone named "${participantName}". Please check the name and try again.` };
            }
        }
        if (fc.name === 'bookStudio') {
            const { artistName, studioName, engineerName, date, startTime, duration } = fc.args;
            
            const artist = appData.artists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
            const stoodio = appData.stoodioz.find(s => s.name.toLowerCase() === studioName.toLowerCase());
            const engineer = appData.engineers.find(e => e.name.toLowerCase() === engineerName.toLowerCase());

            if (!artist || !stoodio || !engineer) {
                 let missing = [!artist && "artist", !stoodio && "studio", !engineer && "engineer"].filter(Boolean).join(', ');
                 return { type: 'text', text: `I'm sorry, I couldn't find the following details: ${missing}. Please confirm the names and try again.` };
            }
            
            const room = stoodio.rooms[0];
            const engineerPayRate = stoodio.engineerPayRate;
            const totalCost = (room.hourlyRate * duration) + (engineerPayRate * duration);

            const bookingDetails: Omit<Booking, 'id' | 'status'> = {
                room, date, startTime, duration, totalCost, engineerPayRate,
                requestType: 'SPECIFIC_ENGINEER' as any,
                stoodio, artist, engineer, producer: null,
                requestedEngineerId: engineer.id,
                bookedById: user!.id,
                bookedByRole: userRole as any,
            };

            return {
                type: 'function',
                action: 'bookStudio',
                payload: { bookingDetails },
                text: `Perfect. I'm confirming a ${duration}-hour session for ${artist.name} at ${stoodio.name} with ${engineer.name} on ${date} at ${startTime}.`
            };
        }
        if (fc.name === 'vibeMatch') {
            const { vibeDescription } = fc.args;
            // Simulate Vibe Match logic
            const mockResults: VibeMatchResult = {
                vibeDescription: `Based on your request for: "${vibeDescription}"`,
                tags: ['dreamy', 'atmospheric', 'lo-fi'],
                recommendations: [
                    { type: 'stoodio', entity: appData.stoodioz[0], reason: 'Known for its great vocal booth, perfect for ethereal sounds.' },
                    { type: 'engineer', entity: appData.engineers[0], reason: 'Specializes in Indie Rock and ambient textures.' },
                    { type: 'producer', entity: appData.producers[0], reason: 'Creates beats in the Trap and Hip-Hop genres which could add an interesting layer.' },
                ].filter(rec => rec.entity) as VibeMatchResult['recommendations'] // filter out undefined entities
            };

            const toolResponse = await chat.sendMessage({
                toolResponse: {
                    functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: `I found ${mockResults.recommendations.length} potential matches for that vibe.` }
                    }
                }
            });

            return {
                type: 'function',
                action: 'showVibeMatchResults',
                payload: { results: mockResults },
                text: toolResponse.text,
            };
        }
        if (fc.name === 'writeMusic') {
             const creativeResponse = await chat.sendMessage({
                  toolResponse: {
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: `Generating ${fc.args.type} about ${fc.args.topic} in a ${fc.args.genre} style as requested.` }
                    }
                  }
                });
            return { type: 'text', text: creativeResponse.text };
        }
    }

    return { type: 'text', text: response.text };
  } catch (error: any) {
    console.error("Error calling Gemini API for Aria Cantata:", error);

    // Directly check for the rate-limit error structure based on the user-provided error message.
    if (error?.error?.code === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED') {
        return { 
            type: 'text', 
            text: "Darling, it seems I'm quite in demand at the moment and my systems are a bit overwhelmed. Could you try again in a few moments? I'll be waiting." 
        };
    }
    
    // Fallback for other error formats.
    const errorMessage = String(error);
    if (errorMessage.includes('429') || /resource.*?exhausted/i.test(errorMessage)) {
         return { 
            type: 'text', 
            text: "Darling, it seems I'm quite in demand at the moment and my systems are a bit overwhelmed. Could you try again in a few moments? I'll be waiting." 
        };
    }

    return { type: 'text', text: "I'm having a little trouble connecting right now. Please try again in a moment. 🛠️" };
  }
};