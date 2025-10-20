

import React from 'react';

const ApiKeyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Check for the key in both Vite/Vercel and the live preview environments.
    const apiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY;

    if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('{{')) {
        // If the key exists and is not a placeholder, render the main application
        return <>{children}</>;
    }

    // If the key is missing, render the setup instructions
    return (
        <div className="main-container flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-zinc-900/80 backdrop-blur-lg rounded-2xl border border-zinc-700 p-8 text-zinc-200 shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-orange-400 mb-4">API Key Configuration Required</h1>
                <p className="text-center text-zinc-400 mb-8">
                    This application requires a Google AI API key to function. The app is not working because the key is missing. Please follow the steps below for your environment.
                </p>

                <div className="space-y-8">
                    {/* Instructions for the Live Preview Environment */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3">1. For This Live Preview</h2>
                        <p className="text-zinc-400 mb-4">To make this preview pane work, you must select an API key from your Google Cloud projects.</p>
                        <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                            <li>In the editor, find the button labeled <strong className="text-orange-400">"Set API key"</strong> or a similar name in the top bar or side panel.</li>
                            <li>Click it and select the key you wish to use. The preview will automatically refresh.</li>
                        </ol>
                    </div>

                    {/* Instructions for Vercel Deployment */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3">2. For Your Vercel Deployment</h2>
                        <p className="text-zinc-400 mb-4">To make your live website work, you must add the API key to your Vercel project's settings.</p>
                         <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                            <li>Go to your project on the Vercel Dashboard.</li>
                            <li>Navigate to the <strong className="text-orange-400">Settings</strong> tab.</li>
                            <li>Click on <strong className="text-orange-400">Environment Variables</strong> in the left menu.</li>
                            <li>Add a new variable with the following name and value:</li>
                            <li className="ml-4 mt-2"><strong>NAME:</strong> <code className="bg-zinc-900 p-1 rounded">VITE_API_KEY</code> <span className="text-yellow-400 font-semibold">(The 'VITE_' prefix is required!)</span></li>
                            <li className="ml-4"><strong>VALUE:</strong> Paste your API key from Google AI Studio.</li>
                            <li className="mt-2">Ensure the variable is applied to Production, Preview, and Development environments.</li>
                            <li><strong className="text-orange-400">Save</strong> the variable.</li>
                            <li>Go to the <strong className="text-orange-400">Deployments</strong> tab and <strong className="text-orange-400">Redeploy</strong> your latest commit to apply the changes.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyGate;