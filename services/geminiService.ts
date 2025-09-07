
import { GoogleGenAI, Type } from "@google/genai";
import type { Engineer, Stoodio, VibeMatchResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This is a mock function. In a real app, you might try to extract metadata
// from the URL, or use a service that can analyze audio from a link.
const getMockTrackInfo = (songUrl: string): string => {
    // Simple mock based on URL keywords
    if (songUrl.toLowerCase().includes('drake')) return "Modern hip-hop track with deep 808s, introspective lyrics, and a clean vocal production.";
    if (songUrl.toLowerCase().includes('taylor')) return "A folk-pop song with prominent acoustic guitar, layered vocal harmonies, and heartfelt storytelling.";
    if (songUrl.toLowerCase().includes('daft-punk')) return "An electronic funk track with a strong four-on-the-floor beat, vocoder vocals, and vintage synth sounds.";
    if (songUrl.toLowerCase().includes('static-bloom')) return "An indie rock song with fuzzy guitars, a driving bassline, and anthemic chorus vocals.";
    return "A dream-pop track with ethereal soundscapes, hazy synths, and reverb-heavy vocals.";
}

export const getVibeMatchResults = async (
    songUrl: string, 
    allStoodioz: Stoodio[], 
    allEngineers: Engineer[]
): Promise<VibeMatchResult> => {

    const mockTrackInfo = getMockTrackInfo(songUrl);
    
    // Create a simplified list of available stoodioz and engineers for the prompt
    const stoodiozForPrompt = allStoodioz.map(s => ({ id: s.id, name: s.name, description: s.description, amenities: s.amenities }));
    const engineersForPrompt = allEngineers.map(e => ({ id: e.id, name: e.name, bio: e.bio, specialties: e.specialties }));

    const prompt = `
        Based on the following audio track description: "${mockTrackInfo}", and the provided lists of recording studios and audio engineers, act as an expert A&R and music producer. Your task is to find the best matches for the artist.

        Available Stoodioz: ${JSON.stringify(stoodiozForPrompt)}
        Available Engineers: ${JSON.stringify(engineersForPrompt)}

        Please return a JSON object with the following structure:
        - "vibeDescription": A short, creative, 2-sentence description of the track's overall vibe.
        - "tags": An array of 3-5 short, descriptive tags (e.g., "Warm Analog", "Modern Trap", "Ethereal Vocals").
        - "recommendations": An array of 3-4 recommendations. For each recommendation, provide the 'id' of the stoodio or engineer, their 'type' ('stoodio' or 'engineer'), and a concise, one-sentence 'reason' explaining why they are a great match for the track's vibe. Focus on specific gear from amenities or specialties from their bio.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        vibeDescription: { type: Type.STRING },
                        tags: { 
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                },
                                required: ["id", "type", "reason"]
                            }
                        }
                    },
                    required: ["vibeDescription", "tags", "recommendations"]
                },
            },
        });

        const resultJson = JSON.parse(response.text);
        
        const hydratedRecommendations = resultJson.recommendations.map((rec: any) => {
            if (rec.type === 'stoodio') {
                const entity = allStoodioz.find(s => s.id === rec.id);
                return entity ? { ...rec, entity } : null;
            } else if (rec.type === 'engineer') {
                const entity = allEngineers.find(e => e.id === rec.id);
                return entity ? { ...rec, entity } : null;
            }
            return null;
        }).filter(Boolean);

        return {
            vibeDescription: resultJson.vibeDescription,
            tags: resultJson.tags,
            recommendations: hydratedRecommendations,
        };

    } catch (error) {
        console.error("Error with Gemini API Vibe Matcher:", error);
        // Fallback result in case of an API error
        return {
            vibeDescription: "Could not analyze the track's vibe. Here are some general recommendations.",
            tags: ["Error"],
            recommendations: [
                { type: 'stoodio', entity: allStoodioz[0], reason: "A versatile studio with great gear." },
                { type: 'engineer', entity: allEngineers[0], reason: "An experienced engineer with a wide range of skills." }
            ]
        };
    }
};


export const generateEngineerProfile = async (): Promise<Engineer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a realistic profile for a freelance audio engineer. Include a name, a plausible email address, a short bio (2-3 sentences), and a list of 3-4 music genres they specialize in. The name should sound like a real person.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The engineer's full name."
            },
            email: {
              type: Type.STRING,
              description: "A plausible email address for the engineer."
            },
            bio: {
              type: Type.STRING,
              description: "A short 2-3 sentence biography about their experience and passion."
            },
            specialties: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "A list of 3-4 music genres they specialize in."
            }
          },
          required: ["name", "email", "bio", "specialties"]
        },
      },
    });

    const jsonString = response.text;
    const engineerProfile = JSON.parse(jsonString);
    return {
      ...engineerProfile,
      id: `eng-gen-${Date.now()}`,
      password: 'password',
      rating: Number((4.5 + Math.random() * 0.5).toFixed(1)),
      sessionsCompleted: Math.floor(Math.random() * 200),
      followers: Math.floor(Math.random() * 1000),
      following: { artists: [], engineers: [], stoodioz: [] },
      followerIds: [],
      imageUrl: `https://picsum.photos/seed/${engineerProfile.name.replace(/\s/g, "")}/200/200`,
      audioSampleUrl: "https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3",
      coordinates: {
        lat: 34.0522 + (Math.random() - 0.5) * 10, // Randomize around LA
        lon: -118.2437 + (Math.random() - 0.5) * 10,
      },
      isAvailable: true,
      walletBalance: 0,
      walletTransactions: [],
    };

  } catch (error) {
    console.error("Error generating engineer profile:", error);
    // Return a fallback profile in case of API error
    return {
      id: 'eng-fallback',
      name: "Alex 'Patch' Robinson",
      email: 'alex.fallback@example.com',
      password: 'password',
      bio: "A seasoned audio engineer with over a decade of experience in both analog and digital domains. Passionate about helping artists achieve their perfect sound. (Fallback profile due to API error).",
      specialties: ["Indie Rock", "Hip-Hop", "Electronic", "Folk"],
      rating: 4.9,
      sessionsCompleted: 238,
      followers: 841,
      following: { artists: [], engineers: [], stoodioz: [] },
      followerIds: [],
      imageUrl: 'https://picsum.photos/seed/eng1/200/200',
      audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3',
      coordinates: { lat: 34.06, lon: -118.25 },
      isAvailable: true,
      walletBalance: 0,
      walletTransactions: [],
    };
  }
};