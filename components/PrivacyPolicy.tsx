import React from 'react';
import { ChevronLeftIcon } from './icons';

interface PrivacyPolicyProps {
    onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto bg-zinc-800 p-8 rounded-2xl border border-zinc-700">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Setup
            </button>
            <div className="prose prose-invert prose-headings:font-bold prose-headings:text-orange-500 prose-a:text-orange-400 max-w-none">
                <h1>User Agreement & Privacy Policy</h1>
                <p><em>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

                <p>Welcome to Stoodioz! This User Agreement and Privacy Policy ("Policy") explains how we collect, use, and protect your information when you use our platform to connect artists, engineers, and recording studios ("Services"). By creating an account, you agree to this Policy.</p>
                
                <h2>1. Information We Collect</h2>
                <p>We collect information to provide and improve our Services:</p>
                <ul>
                    <li><strong>Account Information:</strong> When you register, we collect your name, email, password, and profile details (bio, specialties, location, etc.).</li>
                    <li><strong>Booking Information:</strong> We collect details about sessions you book or offer, including dates, times, locations, and costs.</li>
                    <li><strong>Communications:</strong> We collect messages sent through our platform to facilitate communication between users.</li>
                    <li><strong>Payment Information:</strong> All payments are processed by a secure third-party payment processor (e.g., Stripe, PayPal). We do not store your full credit card number. We only receive a token and confirmation of payment.</li>
                </ul>

                <h2>2. How We Use Your Information</h2>
                <p>Your information is used for the following purposes:</p>
                <ul>
                    <li>To operate and maintain the Stoodioz platform.</li>
                    <li>To facilitate bookings and connections between Artists, Engineers, and Stoodioz.</li>
                    <li>To process payments and fees for services rendered.</li>
                    <li>To communicate with you about your account, bookings, and platform updates.</li>
                    <li>To improve our Services and develop new features.</li>
                </ul>
                
                <h2>3. Information Sharing</h2>
                <p>We only share your information in the following circumstances:</p>
                 <ul>
                    <li><strong>With Other Users:</strong> To facilitate a booking, we share relevant profile information between the involved parties (e.g., an artist's name is shared with the studio and engineer).</li>
                    <li><strong>With Service Providers:</strong> We share information with third-party vendors, such as our payment processor, who perform services on our behalf.</li>
                    <li><strong>For Legal Reasons:</strong> We may disclose your information if required by law or in response to a valid legal request.</li>
                </ul>
                
                <h2>4. Data Security</h2>
                <p>We are committed to protecting your data. We implement industry-standard security measures to prevent unauthorized access, use, or disclosure of your information. However, no method of transmission over the internet or electronic storage is 100% secure.</p>
                
                <h2 className="text-red-400">5. Disclaimer of Warranties and Limitation of Liability</h2>
                <p><strong>PLEASE READ THIS SECTION CAREFULLY.</strong></p>
                <p>THE STOODIOZ PLATFORM AND ITS SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</p>
                <p>TO THE FULLEST EXTENT PERMITTED BY LAW, STOODIOZ, ITS OWNERS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</p>
                <ul>
                    <li>YOUR ACCESS TO, USE OF, OR INABILITY TO ACCESS OR USE THE SERVICES.</li>
                    <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES, INCLUDING OTHER USERS.</li>
                    <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</li>
                </ul>
                <p>THIS INCLUDES, BUT IS NOT LIMITED TO, ANY DAMAGES RESULTING FROM DATA BREACHES OR SECURITY FAILURES. YOUR USE OF THE PLATFORM IS SOLELY AT YOUR OWN RISK.</p>
                
                <h2>6. Your Responsibilities</h2>
                <p>You are responsible for the accuracy of your profile information and for your interactions with other users. Stoodioz acts as a marketplace to connect users and is not a party to any direct agreement between an Artist and an Engineer or Stoodio.</p>
                
                <h2>7. Changes to This Policy</h2>
                <p>We may update this Policy from time to time. We will notify you of any significant changes by email or through a notice on the platform. Your continued use of the Services after such changes constitutes your acceptance of the new Policy.</p>
                
                <h2>8. Contact Us</h2>
                <p>If you have any questions about this Policy, please contact us at <a href="mailto:support@stoodioz.com">support@stoodioz.com</a>.</p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;