import React from 'react';

const DevNotificationButton: React.FC = () => {
    const showDevNotification = () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            alert('This browser does not support desktop notifications.');
            return;
        }

        if (Notification.permission !== 'granted') {
            alert('Please enable notifications first to test this feature.');
            return;
        }

        const newsAndTips = [
            { title: 'Studio Tip!', body: 'Try using parallel compression on your drums for a punchier sound.' },
            { title: 'New Feature ✨', body: 'You can now filter studios by available vintage gear.' },
            { title: 'Stoodioz News', body: 'We\'ve partnered with 5 new studios in the Chicago area! Check them out.' }
        ];
        
        const randomNotification = newsAndTips[Math.floor(Math.random() * newsAndTips.length)];

        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.showNotification(randomNotification.title, {
                    body: randomNotification.body,
                    tag: 'dev-notification'
                });
            } else {
                alert('Service worker not registered. Cannot show notification.');
            }
        });
    };

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <button 
                onClick={showDevNotification}
                className="bg-zinc-800 text-zinc-300 font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-zinc-700 transition-all duration-300 flex items-center gap-2"
                title="Simulate a notification from the developer"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 10a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm12 0a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1-1zM4.22 5.636a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm11.314 0a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM4.22 14.364a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zm11.314 0a1 1 0 01-1.414 0l-.707-.707a1 1 0 11-1.414 1.414l.707.707a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Send Dev Tip
            </button>
        </div>
    );
};

export default DevNotificationButton;