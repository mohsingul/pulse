import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/Card';
import { ArrowLeft } from 'lucide-react';
import { historyAPI } from '@/utils/api';
import { format } from 'date-fns';

interface HistoryScreenProps {
  coupleId: string;
  userId: string;
  user1Id: string;
  user2Id: string;
  userName: string;
  partnerName: string;
  onBack: () => void;
  onDoodleClick: (doodle: any) => void;
}

export function HistoryScreen({ coupleId, userId, user1Id, user2Id, userName, partnerName, onBack, onDoodleClick }: HistoryScreenProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'mine' | 'partner'>('all');
  
  // Determine if current user is user1 or user2
  const isUser1 = userId === user1Id;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await historyAPI.get(coupleId);
      const allHistory = response.history || [];
      
      // Transform history to include data from BOTH users
      const transformedHistory = allHistory
        .map((day: any) => {
          const myMood = day[isUser1 ? 'user1Mood' : 'user2Mood'];
          const myIntensity = day[isUser1 ? 'user1Intensity' : 'user2Intensity'];
          const myMessage = day[isUser1 ? 'user1Message' : 'user2Message'];
          const myDoodle = day[isUser1 ? 'user1Doodle' : 'user2Doodle'];
          const myDoodleGallery = day[isUser1 ? 'user1DoodleGallery' : 'user2DoodleGallery'];
          const myUpdatedAt = day[isUser1 ? 'user1UpdatedAt' : 'user2UpdatedAt'];

          const partnerMood = day[isUser1 ? 'user2Mood' : 'user1Mood'];
          const partnerIntensity = day[isUser1 ? 'user2Intensity' : 'user1Intensity'];
          const partnerMessage = day[isUser1 ? 'user2Message' : 'user1Message'];
          const partnerDoodle = day[isUser1 ? 'user2Doodle' : 'user1Doodle'];
          const partnerDoodleGallery = day[isUser1 ? 'user2DoodleGallery' : 'user1DoodleGallery'];
          const partnerUpdatedAt = day[isUser1 ? 'user2UpdatedAt' : 'user1UpdatedAt'];
          
          // Only include days where at least one person shared something
          const hasMine = myMood || myMessage || myDoodle;
          const hasPartner = partnerMood || partnerMessage || partnerDoodle;
          
          if (!hasMine && !hasPartner) {
            return null;
          }
          
          return {
            date: day.date,
            mine: {
              mood: myMood,
              intensity: myIntensity,
              message: myMessage,
              doodle: myDoodle,
              doodleGallery: myDoodleGallery || [],
              updatedAt: myUpdatedAt || day.updatedAt,
              name: userName,
            },
            partner: {
              mood: partnerMood,
              intensity: partnerIntensity,
              message: partnerMessage,
              doodle: partnerDoodle,
              doodleGallery: partnerDoodleGallery || [],
              updatedAt: partnerUpdatedAt || day.updatedAt,
              name: partnerName,
            },
            reactions: day.reactions || [],
          };
        })
        .filter((day: any) => day !== null);
      
      setHistory(transformedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return '';
    }
  };

  // Filter history based on selected filter
  const filteredHistory = history.filter((day) => {
    if (filter === 'all') return true;
    if (filter === 'mine') {
      // Only show days where I have shared something
      return day.mine.mood || day.mine.message || day.mine.doodle;
    }
    if (filter === 'partner') {
      // Only show days where partner has shared something
      return day.partner.mood || day.partner.message || day.partner.doodle;
    }
    return true;
  });

  const handleDoodleClick = (doodleData: any, personData: any) => {
    onDoodleClick({
      doodle: doodleData,
      creatorName: personData.name,
      timestamp: personData.updatedAt,
      isMine: personData.name === userName,
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center mb-4">
          <button
            onClick={selectedDay ? () => setSelectedDay(null) : onBack}
            className="p-2 hover:bg-accent rounded-full transition-colors -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold ml-4">
            {selectedDay ? formatDate(selectedDay.date) : 'History'}
          </h2>
        </div>

        {/* Filter Tabs */}
        {!selectedDay && (
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
        )}
      </div>

      {/* Content */}
      {selectedDay ? (
        /* Day Detail - Show BOTH users */
        <div className="flex-1 px-6 py-8 overflow-y-auto space-y-6">
          {/* My Pulse */}
          {(selectedDay.mine.mood || selectedDay.mine.message || selectedDay.mine.doodle) && (
            <Card gradient className="min-h-[300px]">
              <div className="space-y-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Your Pulse</h3>
                  {selectedDay.mine.updatedAt && (
                    <div className="text-sm text-white/70">
                      {formatTime(selectedDay.mine.updatedAt)}
                    </div>
                  )}
                </div>

                {selectedDay.mine.mood && (
                  <div className="text-center space-y-2">
                    <div className="text-8xl">{selectedDay.mine.mood}</div>
                    {selectedDay.mine.intensity && (
                      <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm">
                        Intensity: {selectedDay.mine.intensity}
                      </div>
                    )}
                  </div>
                )}

                {selectedDay.mine.message && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <p className="text-lg leading-relaxed">{selectedDay.mine.message}</p>
                  </div>
                )}

                {selectedDay.mine.doodle && (
                  <div 
                    className="rounded-2xl p-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDoodleClick(selectedDay.mine.doodle, selectedDay.mine)}
                  >
                    <img
                      src={selectedDay.mine.doodle}
                      alt="Your Doodle"
                      className="w-full h-48 object-contain"
                    />
                    <p className="text-center text-sm text-white/70 mt-2">Click to view full size</p>
                  </div>
                )}
                
                {/* All doodles from gallery */}
                {selectedDay.mine.doodleGallery && selectedDay.mine.doodleGallery.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground dark:text-white/70">All Doodles ({selectedDay.mine.doodleGallery.length})</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedDay.mine.doodleGallery.map((doodleEntry: any, idx: number) => (
                        <div 
                          key={idx}
                          className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl p-3 cursor-pointer hover:bg-white/90 dark:hover:bg-white/20 transition-colors"
                          onClick={() => handleDoodleClick(doodleEntry.doodle, { ...selectedDay.mine, doodle: doodleEntry.doodle, timestamp: doodleEntry.timestamp })}
                        >
                          <img
                            src={doodleEntry.doodle}
                            alt={`Your Doodle ${idx + 1}`}
                            className="w-full h-32 object-contain rounded-lg"
                          />
                          <p className="text-center text-xs text-muted-foreground dark:text-white/60 mt-1">
                            {format(new Date(doodleEntry.timestamp), 'h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Partner's Pulse */}
          {(selectedDay.partner.mood || selectedDay.partner.message || selectedDay.partner.doodle) && (
            <Card className="min-h-[300px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border-purple-500/20">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{partnerName}'s Pulse</h3>
                  {selectedDay.partner.updatedAt && (
                    <div className="text-sm text-muted-foreground">
                      {formatTime(selectedDay.partner.updatedAt)}
                    </div>
                  )}
                </div>

                {selectedDay.partner.mood && (
                  <div className="text-center space-y-2">
                    <div className="text-8xl">{selectedDay.partner.mood}</div>
                    {selectedDay.partner.intensity && (
                      <div className="inline-block px-4 py-1 bg-accent rounded-full text-sm">
                        Intensity: {selectedDay.partner.intensity}
                      </div>
                    )}
                  </div>
                )}

                {selectedDay.partner.message && (
                  <div className="bg-accent rounded-2xl p-6">
                    <p className="text-lg leading-relaxed">{selectedDay.partner.message}</p>
                  </div>
                )}

                {selectedDay.partner.doodle && (
                  <div 
                    className="bg-accent rounded-2xl p-4 cursor-pointer hover:bg-accent/80 transition-colors"
                    onClick={() => handleDoodleClick(selectedDay.partner.doodle, selectedDay.partner)}
                  >
                    <img
                      src={selectedDay.partner.doodle}
                      alt={`${partnerName}'s Doodle`}
                      className="w-full h-48 object-contain rounded-xl"
                    />
                    <p className="text-center text-sm text-muted-foreground mt-2">Click to view full size</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* History List */
        <div className="flex-1 px-6 py-8 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl">📅</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
                <p className="text-muted-foreground">
                  {filter === 'mine' ? 'You haven\'t' : filter === 'partner' ? `${partnerName} hasn't` : 'No one has'} shared any pulses yet
                </p>
              </div>
            </div>
          ) : (
            filteredHistory.map((day, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-xl transition-all"
                onClick={() => setSelectedDay(day)}
              >
                <div className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-[image:var(--pulse-gradient)] flex flex-col items-center justify-center text-white text-center">
                        <div className="text-xs font-medium">
                          {format(new Date(day.date), 'MMM')}
                        </div>
                        <div className="text-lg font-bold">
                          {format(new Date(day.date), 'd')}
                        </div>
                      </div>
                      <span className="font-semibold">{formatDate(day.date)}</span>
                    </div>
                  </div>

                  {/* My Content */}
                  {(day.mine.mood || day.mine.message || day.mine.doodle) && (filter === 'all' || filter === 'mine') && (
                    <div className="flex items-start space-x-3 pl-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[image:var(--pulse-gradient)] flex items-center justify-center text-white text-xs font-bold">
                        {userName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-1">You</p>
                        <div className="flex items-center space-x-2">
                          {day.mine.mood && <span className="text-xl">{day.mine.mood}</span>}
                          {day.mine.message && (
                            <p className="text-sm text-muted-foreground line-clamp-1 flex-1">
                              {day.mine.message}
                            </p>
                          )}
                          {day.mine.doodle && (
                            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                              <img src={day.mine.doodle} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Partner's Content */}
                  {(day.partner.mood || day.partner.message || day.partner.doodle) && (filter === 'all' || filter === 'partner') && (
                    <div className="flex items-start space-x-3 pl-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {partnerName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-1">{partnerName}</p>
                        <div className="flex items-center space-x-2">
                          {day.partner.mood && <span className="text-xl">{day.partner.mood}</span>}
                          {day.partner.message && (
                            <p className="text-sm text-muted-foreground line-clamp-1 flex-1">
                              {day.partner.message}
                            </p>
                          )}
                          {day.partner.doodle && (
                            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                              <img src={day.partner.doodle} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}