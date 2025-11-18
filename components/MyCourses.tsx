
import React, { useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import { useMasterclass } from '../hooks/useMasterclass';
import { PlayIcon, MusicNoteIcon } from './icons';
import type { Engineer, Producer, Masterclass } from '../types';

interface CourseCardProps {
    course: {
        masterclass: NonNullable<Engineer['masterclass']>;
        owner: Engineer | Producer;
    };
    onWatch: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onWatch }) => {
    return (
        <div className="cardSurface p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-32 h-32 sm:h-20 flex-shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center">
                 <MusicNoteIcon className="w-12 h-12 text-zinc-600" />
            </div>
            <div className="flex-grow text-center sm:text-left">
                <h3 className="font-bold text-lg text-zinc-100">{course.masterclass.title}</h3>
                <p className="text-sm text-zinc-400">by {course.owner.name}</p>
            </div>
            <button
                onClick={onWatch}
                className="w-full sm:w-auto flex-shrink-0 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-2"
            >
                <PlayIcon className="w-5 h-5" />
                Watch Now
            </button>
        </div>
    );
};


const MyCourses: React.FC = () => {
    const { currentUser, engineers, producers } = useAppState();
    const { openWatchMasterclassModal } = useMasterclass();

    const myCourses = useMemo(() => {
        if (!currentUser?.purchased_masterclass_ids) {
            return [];
        }
        
        const purchasedIds = new Set(currentUser.purchased_masterclass_ids);
        const allCreators = [...engineers, ...producers];
        
        const courses = allCreators
            // FIX: Check for the existence of the masterclass property before filtering
            .filter(creator => 'masterclass' in creator && creator.masterclass && purchasedIds.has(creator.masterclass.id))
            .map(creator => ({
                // FIX: Added a non-null assertion as the filter guarantees it exists
                masterclass: creator.masterclass!,
                owner: creator
            }));
            
        return courses;

    }, [currentUser, engineers, producers]);

    if (myCourses.length === 0) {
        return (
            <div className="p-6 text-center cardSurface">
                <h1 className="text-2xl font-bold mb-4 text-zinc-100">My Courses</h1>
                <MusicNoteIcon className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">You haven't purchased any masterclasses yet.</p>
                <p className="text-sm text-zinc-500 mt-2">Browse engineer and producer profiles to find classes.</p>
            </div>
        );
    }

    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold mb-6 text-zinc-100">My Courses ({myCourses.length})</h1>
            <div className="space-y-4">
                {myCourses.map(course => (
                    <CourseCard 
                        key={course.masterclass.id}
                        course={course}
                        onWatch={() => openWatchMasterclassModal(course.masterclass, course.owner)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MyCourses;
