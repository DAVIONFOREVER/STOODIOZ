
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const LabelAnalytics: React.FC = () => {
    // Mock Data
    const spendData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Monthly Spend ($)',
            data: [12000, 19000, 15000, 22000, 18000, 25000],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const rosterActivityData = {
        labels: ['Artist A', 'Artist B', 'Artist C', 'Producer X'],
        datasets: [{
            label: 'Sessions Completed',
            data: [12, 8, 15, 5],
            backgroundColor: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'],
        }]
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-zinc-100">Label Analytics</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="cardSurface p-6">
                    <h3 className="font-bold text-zinc-200 mb-4">Spending Trends</h3>
                    <div className="h-64">
                        <Line data={spendData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: '#333' } } } }} />
                    </div>
                </div>
                <div className="cardSurface p-6">
                    <h3 className="font-bold text-zinc-200 mb-4">Roster Activity</h3>
                    <div className="h-64">
                        <Bar data={rosterActivityData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelAnalytics;
