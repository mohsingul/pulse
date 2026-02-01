import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/Card';
import { ArrowLeft, User } from 'lucide-react';
import { historyAPI } from '@/utils/api';
import { format } from 'date-fns';

interface DoodleGalleryScreenProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
  onDoodleClick: (doodle: any) => void;
}

type FilterType = 'all' | 'mine' | 'partner';

export function DoodleGalleryScreen({
  coupleId,
  userId,
  user1Id,
  user2Id,
  userName,
  partnerName,
  onBack,
  onDoodleClick,
}: DoodleGalleryScreenProps) {
  const [doodles, setDoodles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const isUser1 = userId === user1Id;

  useEffect(() => {
    fetchDoodles();
  }, []);

  const fetchDoodles = async () => {
    try {
      const response = await historyAPI.get(coupleId);
      const allHistory = response.history || [];

      // Extract all doodles from both users' galleries
      const allDoodles: any[] = [];

      allHistory.forEach((day: any) => {
        // User1's doodle gallery
        if (day.user1DoodleGallery && Array.isArray(day.user1DoodleGallery)) {
          day.user1DoodleGallery.forEach((doodleEntry: any) => {
            allDoodles.push({
              doodle: doodleEntry.doodle,
              createdBy: user1Id,
              creatorName: isUser1 ? 'You' : partnerName,
              isMine: isUser1,
              date: day.date,
              timestamp: doodleEntry.timestamp,
            });
          });
        }
        // User2's doodle gallery
        if (day.user2DoodleGallery && Array.isArray(day.user2DoodleGallery)) {
          day.user2DoodleGallery.forEach((doodleEntry: any) => {
            allDoodles.push({
              doodle: doodleEntry.doodle,
              createdBy: user2Id,
              creatorName: isUser1 ? partnerName : 'You',
              isMine: !isUser1,
              date: day.date,
              timestamp: doodleEntry.timestamp,
            });
          });
        }
      });

      // Sort by timestamp descending
      allDoodles.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setDoodles(allDoodles);
    } catch (error) {
      console.error('Error fetching doodles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoodles = doodles.filter((doodle) => {
    if (filter === 'all') return true;
    if (filter === 'mine') return doodle.isMine;
    if (filter === 'partner') return !doodle.isMine;
    return true;
  });

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold ml-4">Doodle Gallery</h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'all'
                ? 'bg-[image:var(--pulse-gradient)] text-white'
                : 'bg-accent text-foreground hover:bg-accent/80'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'mine'
                ? 'bg-[image:var(--pulse-gradient)] text-white'
                : 'bg-accent text-foreground hover:bg-accent/80'
            }`}
          >
            Mine
          </button>
          <button
            onClick={() => setFilter('partner')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'partner'
                ? 'bg-[image:var(--pulse-gradient)] text-white'
                : 'bg-accent text-foreground hover:bg-accent/80'
            }`}
          >
            {partnerName}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading doodles...</p>
          </div>
        ) : filteredDoodles.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🎨</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No doodles yet</h3>
              <p className="text-muted-foreground">
                Start drawing ❤️
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredDoodles.map((doodle, index) => (
              <div
                key={index}
                className="cursor-pointer group"
                onClick={() => onDoodleClick(doodle)}
              >
                {/* Doodle Preview Card */}
                <div className="aspect-square bg-gradient-to-br from-[#FB3094]/5 via-[#A83FFF]/5 to-[#2571FF]/5 rounded-2xl overflow-hidden border-2 border-border hover:border-[#A83FFF] transition-all group-hover:scale-105 group-hover:shadow-xl">
                  <img
                    src={doodle.doodle}
                    alt="Doodle"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info - Compact */}
                <div className="mt-2 px-1">
                  <div className="flex items-center space-x-1.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                        doodle.isMine
                          ? 'bg-[image:var(--pulse-gradient)]'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                    >
                      {doodle.creatorName[0]}
                    </div>
                    <span className="text-xs font-medium truncate">
                      {doodle.creatorName}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDate(doodle.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}