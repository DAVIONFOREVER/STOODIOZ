import React from 'react';

const ApiKeyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Check for all required environment variables for both Supabase and Gemini.
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    const geminiApiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY;

    const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

    if (areKeysValid(supabaseUrl) && areKeysValid(supabaseAnonKey) && areKeysValid(geminiApiKey)) {
        // If all keys exist and are not placeholders, render the main application.
        return <>{children}</>;
    }

    // If any key is missing, render the full setup instructions.
    return (
        <div className="main-container flex items-center justify-center p-4 min-h-screen">
            <div className="w-full max-w-4xl bg-zinc-900/80 backdrop-blur-lg rounded-2xl border border-zinc-700 p-8 text-zinc-200 shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-orange-400 mb-4">Backend & API Configuration Required</h1>
                <p className="text-center text-zinc-400 mb-8">
                    Welcome to Stoodioz! To get your live application running on Vercel, you need to connect it to a database (Supabase) and the AI model (Google AI). Please follow the steps below.
                </p>

                <div className="space-y-8">
                    {/* Instructions for Supabase */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3 text-green-400">Step 1: Set Up Your Free Supabase Database</h2>
                        <p className="text-zinc-400 mb-4">Supabase provides the live, persistent database for your app. All user data, bookings, and posts will be stored here.</p>
                        <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">supabase.com</a> and sign up for a free account.</li>
                            <li>Create a new Project. You can name it "Stoodioz".</li>
                            <li>Once the project is created, navigate to <strong className="text-orange-400">Project Settings</strong> (the gear icon in the left sidebar).</li>
                            <li>In the settings menu, click on <strong className="text-orange-400">API</strong>.</li>
                            <li>On this page, you need to find two pieces of information:
                                <ul className="list-disc list-inside pl-6 mt-2 space-y-1">
                                    <li>Your <strong className="text-orange-400">Project URL</strong>. It will look like <code className="bg-zinc-900 p-1 rounded text-xs">{'https://<your-ref>.supabase.co'}</code>.</li>
                                    <li>Your <strong className="text-orange-400">Project API Key</strong>. You must use the key labeled <strong className="text-orange-400">`anon` `public`</strong>.</li>
                                </ul>
                            </li>
                            <li>Copy both of these values—you'll need them for Vercel in the next step.</li>
                            <li><strong>Important:</strong> You must also create the necessary tables in your Supabase database. Go to the <strong className="text-orange-400">SQL Editor</strong>, create a new query, and paste the table definitions from the project's documentation.</li>
                        </ol>
                    </div>

                    {/* Instructions for Vercel Deployment */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3 text-blue-400">Step 2: Add Environment Variables to Vercel</h2>
                        <p className="text-zinc-400 mb-4">You're in the right place in Vercel! Focus on the form at the very top of the "Environment Variables" page, above the long list of existing keys.</p>
                         <ol className="list-decimal list-inside space-y-3 text-zinc-300">
                            <li>
                                You will add <strong className="text-orange-400">three</strong> new variables one at a time using that form.
                            </li>
                            <li>
                                <strong className="text-zinc-100">For the FIRST variable (Supabase URL):</strong>
                                <ul className="list-disc list-inside pl-6 mt-2 space-y-1 font-mono text-sm">
                                    <li>In the input box labeled <code className="bg-zinc-900 p-1 rounded">key</code> or <code className="bg-zinc-900 p-1 rounded">Name</code>, type exactly: <strong className="text-orange-400">VITE_SUPABASE_URL</strong></li>
                                    <li>In the larger box labeled <code className="bg-zinc-900 p-1 rounded">value</code>, paste the <strong>Project URL</strong> you copied from Supabase.</li>
                                    <li>Ensure all three environment boxes (Production, Preview, Development) are checked.</li>
                                    <li>Click the blue <strong className="text-orange-400">Add</strong> or <strong className="text-orange-400">Save</strong> button.</li>
                                </ul>
                            </li>
                            <li>
                                The page will update. Now, repeat the process for the <strong className="text-zinc-100">SECOND variable (Supabase Key):</strong>
                                 <ul className="list-disc list-inside pl-6 mt-2 space-y-1 font-mono text-sm">
                                    <li><strong>Name:</strong> <strong className="text-orange-400">VITE_SUPABASE_ANON_KEY</strong></li>
                                    <li><strong>Value:</strong> Paste the <strong>anon public key</strong> you copied from Supabase.</li>
                                    <li>Click <strong className="text-orange-400">Add/Save</strong>.</li>
                                </ul>
                            </li>
                             <li>
                                Repeat one last time for the <strong className="text-zinc-100">THIRD variable (Gemini Key):</strong>
                                 <ul className="list-disc list-inside pl-6 mt-2 space-y-1 font-mono text-sm">
                                    <li><strong>Name:</strong> <strong className="text-orange-400">VITE_API_KEY</strong></li>
                                    <li><strong>Value:</strong> Paste your API key from Google AI Studio.</li>
                                    <li>Click <strong className="text-orange-400">Add/Save</strong>.</li>
                                </ul>
                            </li>
                            <li>
                                <strong className="text-orange-400">Final Step - Redeploy:</strong> Once you see all three variables in the list, go to the <strong className="text-orange-400">Deployments</strong> tab, find the latest one, click the "..." menu, and select <strong className="text-orange-400">Redeploy</strong>.
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyGate;