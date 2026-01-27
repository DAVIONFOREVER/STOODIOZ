
import React from 'react';
import { DownloadIcon, ChartBarIcon, CalendarIcon, DollarSignIcon } from '../icons';

const ReportCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onExport: (type: string) => void }> = ({ title, description, icon, onExport }) => (
    <div className="cardSurface p-6 flex flex-col h-full hover:border-orange-500/30 transition-colors">
        <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                {icon}
            </div>
            <div className="flex gap-2">
                <button onClick={() => onExport('csv')} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded border border-zinc-700 transition-colors">CSV</button>
                <button onClick={() => onExport('pdf')} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded border border-zinc-700 transition-colors">PDF</button>
            </div>
        </div>
        <h3 className="text-lg font-bold text-zinc-100 mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 flex-grow">{description}</p>
        <button 
            onClick={() => onExport('csv')}
            className="mt-6 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
        >
            <DownloadIcon className="w-4 h-4" /> Quick Export
        </button>
    </div>
);

const LabelReports: React.FC = () => {
    const handleExport = (reportName: string) => (type: string) => {
        alert(`UI-Only: Exporting ${reportName} as ${type.toUpperCase()}...`);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Reports & Exports</h1>
            <p className="text-zinc-400 mb-8">Download detailed financial and activity reports for your records.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard 
                    title="Monthly Financial Summary" 
                    description="Complete breakdown of all spending, payouts, and budget utilization for the current month."
                    icon={<DollarSignIcon className="w-6 h-6 text-green-400" />}
                    onExport={handleExport('Monthly Financials')}
                />
                <ReportCard 
                    title="Roster Activity Log" 
                    description="Detailed log of all sessions, releases, and engagement metrics for every artist on your roster."
                    icon={<ChartBarIcon className="w-6 h-6 text-blue-400" />}
                    onExport={handleExport('Roster Activity')}
                />
                <ReportCard 
                    title="Booking History" 
                    description="A comprehensive list of all past and upcoming bookings, including statuses and costs."
                    icon={<CalendarIcon className="w-6 h-6 text-orange-400" />}
                    onExport={handleExport('Booking History')}
                />
            </div>
        </div>
    );
};

export default LabelReports;
