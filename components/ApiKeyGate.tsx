import React from 'react';

const DebugInfo: React.FC = () => {
    const supabaseUrl = (process as any).env.VITE_SUPABASE_URL;
    const supabaseAnonKey = (process as any).env.VITE_SUPABASE_ANON_KEY;
    const geminiApiKey = (process as any).env.API_KEY;
    const mapsApiKey = (process as any).env.VITE_GOOGLE_MAPS_API_KEY;
    const stripePk = (process as any).env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

    const varStatus = [
        { name: 'VITE_SUPABASE_URL', found: areKeysValid(supabaseUrl) },
        { name: 'VITE_SUPABASE_ANON_KEY', found: areKeysValid(supabaseAnonKey) },
        { name: 'API_KEY (for Gemini)', found: areKeysValid(geminiApiKey) },
        { name: 'VITE_GOOGLE_MAPS_API_KEY', found: areKeysValid(mapsApiKey) },
        { name: 'VITE_STRIPE_PUBLISHABLE_KEY', found: areKeysValid(stripePk) }
    ];

    return (
        <div className="bg-yellow-900/50 border border-yellow-700/50 p-4 rounded-lg mt-8 text-sm">
            <h3 className="font-semibold text-yellow-300 mb-2">Deployment Status Check</h3>
            <p className="text-yellow-400 mb-3 text-xs">This is a diagnostic tool. If you see this screen on your deployed site, check which variable is marked as "Missing" below and verify its name and value in your Vercel project settings.</p>
            <ul className="space-y-1">
                {varStatus.map(v => (
                    <li key={v.name} className="flex justify-between items-center">
                        <code className="text-zinc-300">{v.name}</code>
                        {v.found ? (
                            <span className="font-bold text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full text-xs">Detected</span>
                        ) : (
                            <span className="font-bold text-red-400 bg-red-900/50 px-2 py-0.5 rounded-full text-xs">Missing</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};


const ApiKeyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Check for all required environment variables using the robust process.env
    const supabaseUrl = (process as any).env.VITE_SUPABASE_URL;
    const supabaseAnonKey = (process as any).env.VITE_SUPABASE_ANON_KEY;
    const geminiApiKey = (process as any).env.API_KEY;
    const mapsApiKey = (process as any).env.VITE_GOOGLE_MAPS_API_KEY;
    const stripePk = (process as any).env.VITE_STRIPE_PUBLISHABLE_KEY;

    const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

    if (areKeysValid(supabaseUrl) && areKeysValid(supabaseAnonKey) && areKeysValid(geminiApiKey) && areKeysValid(mapsApiKey) && areKeysValid(stripePk)) {
        // If all keys exist and are not placeholders, render the main application.
        return <>{children}</>;
    }

    // If any key is missing, render the full setup instructions.
    return (
        <div className="main-container flex items-center justify-center p-4 min-h-screen">
            <div className="w-full max-w-4xl bg-zinc-900/80 backdrop-blur-lg rounded-2xl border border-zinc-700 p-8 text-zinc-200 shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-orange-400 mb-4">Backend & API Configuration Required</h1>
                <p className="text-center text-zinc-400 mb-8">
                    Welcome to Stoodioz! To run the application, you need to connect it to a database (Supabase), AI models (Google AI), and mapping services (Google Maps). Please follow the steps below.
                </p>

                <DebugInfo />

                <div className="space-y-8 mt-8">
                    {/* Instructions for Local Development */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3 text-cyan-400">Option 1: Running Locally (Development)</h2>
                        <p className="text-zinc-400 mb-4">If you are running this app on your local machine, create a <code className="bg-zinc-900 p-1 rounded text-xs">.env</code> file in the project's root directory.</p>
                        <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                            <li>Create a new file named <code className="bg-zinc-900 p-1 rounded text-xs">.env</code> in the main folder (next to <code className="bg-zinc-900 p-1 rounded text-xs">package.json</code>).</li>
                            <li>Paste the following content into the file, replacing the placeholder values with your actual keys.</li>
                        </ol>
                        <pre className="bg-zinc-900 text-zinc-300 p-4 rounded-md mt-4 text-sm overflow-x-auto">
                            <code>
                                VITE_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"<br />
                                VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"<br />
                                API_KEY="YOUR_GEMINI_API_KEY_HERE"<br/>
                                VITE_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"<br/>
                                VITE_STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PK_HERE"
                            </code>
                        </pre>
                        <p className="text-zinc-400 mt-4">After creating and saving the file, you must <strong className="text-orange-400">stop and restart the development server</strong> for the changes to take effect.</p>
                    </div>

                    {/* Instructions for Vercel Deployment */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3 text-blue-400">Option 2: Deploying to Vercel</h2>
                        <p className="text-zinc-400 mb-4">If you are deploying this app to Vercel, set the environment variables in your Vercel project settings.</p>
                        <ol className="list-decimal list-inside space-y-3 text-zinc-300">
                            <li>In your Vercel project dashboard, go to <strong className="text-orange-400">Settings &gt; Environment Variables</strong>.</li>
                            <li>
                                Add the following five variables:
                                <ul className="list-disc list-inside pl-6 mt-2 space-y-2 font-mono text-sm">
                                    <li><strong>Key:</strong> <code className="bg-zinc-900 p-1 rounded">VITE_SUPABASE_URL</code> <br/><strong>Value:</strong> Your Supabase Project URL</li>
                                    <li><strong>Key:</strong> <code className="bg-zinc-900 p-1 rounded">VITE_SUPABASE_ANON_KEY</code> <br/><strong>Value:</strong> Your Supabase anon public key</li>
                                    <li><strong>Key:</strong> <code className="bg-zinc-900 p-1 rounded">API_KEY</code> <br/><strong>Value:</strong> Your Google AI Studio API Key for Gemini</li>
                                    <li><strong>Key:</strong> <code className="bg-zinc-900 p-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> <br/><strong>Value:</strong> Your Google Cloud API Key for Maps</li>
                                    <li><strong>Key:</strong> <code className="bg-zinc-900 p-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code> <br/><strong>Value:</strong> Your Stripe Publishable Key</li>
                                </ul>
                            </li>
                            <li>
                                <strong className="text-orange-400">Redeploy:</strong> After adding the variables, go to the <strong className="text-orange-400">Deployments</strong> tab, find the latest one, click the "..." menu, and select <strong className="text-orange-400">Redeploy</strong>.
                            </li>
                        </ol>
                    </div>

                    {/* Shared instructions for getting keys */}
                    <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                        <h2 className="text-xl font-semibold mb-3 text-green-400">Where to Find Your Keys</h2>
                        <ol className="list-decimal list-inside space-y-3 text-zinc-300">
                            <li><strong>Supabase Keys:</strong> Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">supabase.com</a>, create a project, then navigate to <strong className="text-orange-400">Project Settings &gt; API</strong>. You'll find the URL and the `anon` public key.</li>
                            <li><strong>Gemini API Key:</strong> Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Google AI Studio</a> to get your API key.</li>
                            <li><strong>Google Maps API Key:</strong> Go to the <a href="https://console.cloud.google.com/google/maps-apis/overview" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Google Cloud Console</a>. Create a new project (or select an existing one), then go to the <strong className="text-orange-400">APIs & Services &gt; Library</strong> page and enable the <strong className="text-orange-400">"Maps JavaScript API"</strong>. Finally, go to <strong className="text-orange-400">Credentials</strong> and create a new API key. It's recommended to restrict this key to your website's domain for security.</li>
                            <li><strong>Stripe Publishable Key:</strong> Go to your <a href="https://dashboard.stripe.com/" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Stripe Dashboard</a>. Under the <strong className="text-orange-400">Developers &gt; API keys</strong> section, you will find your "Publishable key". Make sure you are using your Test key for development.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyGate;