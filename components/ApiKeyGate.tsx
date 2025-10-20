import React from 'react';

const ApiKeyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Check if the API_KEY is present in the environment variables
    const apiKey = process.env.API_KEY;

    if (apiKey && apiKey.trim() !== '') {
        // If the key exists, render the main application
        return <>{children}</>;
    }

    // If the key is missing, render the setup instructions
    return (
        <div className="main-container flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-zinc-900/80 backdrop-blur-lg rounded-2xl border border-zinc-700 p-8 text-zinc-200 shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-orange-400 mb-4">API Key Configuration Required</h1>
                <p className="text-center text-zinc-400 mb-8">
                    This application requires a Google AI API key to function. The preview has crashed because the key is missing. Please follow the steps below for your environment.
                </p>

                <div className="space-y-8">
                    {/* Instructions for the Live Preview Environment */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3">1. Fix the Live Preview (Here)</h2>
                        <p className="text-zinc-400 mb-4">To make this preview pane work, you must select an API key from your Google Cloud projects.</p>
                        <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                            <li>In the editor, find the button labeled <strong className="text-orange-400">"Switch to API key"</strong> in the top bar or side panel.</li>
                            <li>Click it. A dialog will appear listing your projects and their API keys.</li>
                            <li>You will see a list of available keys. It might look like:<br/>
                                <code className="block bg-zinc-900 p-2 rounded-md my-2 text-sm text-zinc-400">
                                    [Your Project Name]<br/>
                                    (o) Your API Key
                                </code>
                            </li>
                            <li><strong className="text-orange-400">Click the circle</strong> next to the key you want to use. There is no "Save" or "Paste". Just click it.</li>
                            <li>The preview pane on the right should automatically refresh and the application will load.</li>
                        </ol>
                    </div>

                    {/* Instructions for Vercel Deployment */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3">2. For Vercel Deployment</h2>
                        <p className="text-zinc-400 mb-4">To make your live website work after deploying, you must add the same key to your Vercel project settings.</p>
                         <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                            <li>Go to your project on the Vercel Dashboard.</li>
                            <li>Navigate to the <strong className="text-orange-400">Settings</strong> tab.</li>
                            <li>Click on <strong className="text-orange-400">Environment Variables</strong> in the left menu.</li>
                            <li>Add a new variable with the following details:</li>
                            <li className="ml-4"><strong>KEY:</strong> <code className="bg-zinc-900 p-1 rounded">API_KEY</code></li>
                            <li className="ml-4"><strong>VALUE:</strong> Paste your API key from Google AI Studio.</li>
                            <li>Ensure the variable is applied to Production, Preview, and Development environments.</li>
                            <li><strong className="text-orange-400">Save</strong> and <strong className="text-orange-400">Redeploy</strong> your project for the changes to take effect.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyGate;
