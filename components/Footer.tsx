import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { StoodiozLogoIcon } from './icons';

interface FooterProps {
    onNavigate: (view: AppView) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Cleanup function to remove the event listener
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <footer className={`bg-zinc-900/80 backdrop-blur-sm mt-auto relative transition-all duration-500 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
        }`}>
            <div 
                className="absolute -top-px left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-indigo-500 to-sky-500 opacity-50" 
                style={{ filter: 'blur(12px)', transform: 'scaleY(-1)' }}
                aria-hidden="true"
            ></div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between min-h-20 py-4 sm:py-0 text-sm text-zinc-400">
                    <div className="flex items-center gap-4">
                         <StoodiozLogoIcon className="h-6 w-6 text-zinc-500" />
                        <p>&copy; 2025 Stoodioz Inc. All rights reserved.</p>
                    </div>
                    <div className="flex items-center gap-6 mt-4 sm:mt-0">
                        <button onClick={() => onNavigate(AppView.PRIVACY_POLICY)} className="hover:text-orange-400 transition-colors">
                            Privacy Policy
                        </button>
                        {/* 
                          Future social media links can be added here.
                          e.g., <a href="#" className="hover:text-white"><Icon/></a> 
                        */}
                        <p className="text-zinc-500">v1.0.0</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;