
import React from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useAppState } from '../contexts/AppContext';

const StudioInsights: React.FC = () => {
    const { currentUser } = useAppState();

    if (!currentUser) {
        return null;
    }
    
    return (
        <div>
             <h1 className="text-5xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Studio Insights
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">
                Your performance analytics dashboard.
            </p>
            <AnalyticsDashboard userId={currentUser.id} />
        </div>
    );
};

export default StudioInsights;
