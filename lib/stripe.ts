// This file contains helpers for interacting with the Stripe.js library on the frontend.

// This is the global Stripe object loaded from the script tag in index.html
declare const Stripe: any;

let stripePromise: Promise<any> | null = null;

/**
 * Gets a singleton instance of the Stripe object.
 * This function ensures that the Stripe.js script is loaded only once.
 * @returns A promise that resolves with the Stripe object.
 */
const getStripe = (): Promise<any> => {
    if (!stripePromise) {
        // The Stripe publishable key should be stored as an environment variable.
        // It's safe to expose this key in frontend code.
        const publishableKey = "YOUR_STRIPE_PUBLISHABLE_KEY_HERE";
        if (!publishableKey || !publishableKey.startsWith('pk_')) {
             console.error("Stripe publishable key is missing or invalid. Please set it in your environment variables.");
             return Promise.reject("Stripe key is not configured.");
        }
        stripePromise = new Promise((resolve, reject) => {
            if (typeof Stripe !== 'undefined') {
                resolve(Stripe(publishableKey));
            } else {
                // This is a fallback in case the script in index.html fails to load.
                console.error("Stripe.js has not loaded. Please check the script tag in index.html.");
                reject("Stripe.js is not available.");
            }
        });
    }
    return stripePromise;
};

/**
 * Redirects the user to the Stripe Checkout page for a given session ID.
 * This is the primary function used to initiate a payment flow.
 * @param sessionId The ID of the Stripe Checkout session created by your backend.
 */
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
    try {
        const stripe = await getStripe();
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId,
        });

        if (error) {
            // This error is typically displayed to the user if the browser blocks the redirect.
            console.error("Stripe redirect failed:", error.message);
            // You might want to display a user-friendly error message here.
            alert(`Payment redirect failed: ${error.message}`);
        }
    } catch (error) {
        console.error("Error initializing Stripe for redirect:", error);
        alert("Could not connect to the payment service. Please try again.");
    }
};