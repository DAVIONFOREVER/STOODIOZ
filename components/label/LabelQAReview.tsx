
import React from 'react';
import { CheckCircleIcon, CloseCircleIcon } from '../icons';

const StatusItem: React.FC<{ label: string; status: 'pass' | 'warn' | 'fail' }> = ({ label, status }) => {
    let icon;
    let colorClass;
    
    switch(status) {
        case 'pass': 
            icon = <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            colorClass = "text-zinc-300";
            break;
        case 'warn':
            icon = <div className="w-5 h-5 rounded-full border-2 border-yellow-500 flex items-center justify-center text-xs font-bold text-yellow-500">!</div>;
            colorClass = "text-zinc-200 font-medium";
            break;
        case 'fail':
            icon = <CloseCircleIcon className="w-5 h-5 text-red-500" />;
            colorClass = "text-red-400 font-bold";
            break;
    }

    return (
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 last:border-0">
            <span className={colorClass}>{label}</span>
            {icon}
        </div>
    );
};

const LabelQAReview: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto p-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-zinc-100 mb-6">System Health Check</h1>
            
            <div className="cardSurface overflow-hidden">
                <div className="bg-zinc-800 p-4 border-b border-zinc-700">
                    <h2 className="font-bold text-zinc-100">Configuration Status</h2>
                </div>
                <StatusItem label="Label Profile Completed" status="pass" />
                <StatusItem label="Payment Method Linked" status="pass" />
                <StatusItem label="Roster Contracts Active" status="warn" />
                <StatusItem label="Notification Settings" status="pass" />
                <StatusItem label="Budget Cap Set" status="fail" />
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm">
                <p><strong>Note:</strong> This QA Review is a read-only diagnostic tool. Please visit the respective settings pages to resolve any warnings or failures.</p>
            </div>
        </div>
    );
};

export default LabelQAReview;
