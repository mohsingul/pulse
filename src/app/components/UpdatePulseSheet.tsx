import React, { useState } from 'react';
import { BottomSheet } from '@/app/components/BottomSheet';
import { Button } from '@/app/components/Button';
import { Smile, MessageCircle, Palette } from 'lucide-react';

interface UpdatePulseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: { mood?: string; message?: string; doodle?: string; intensity?: string }) => void;
  onOpenDoodle: () => void;
}

const MOODS = [
  '😊', '😃', '😄', '😁', '🥰', 
  '😍', '🤗', '😌', '😔', '😢',
  '😭', '😩', '😤', '😡', '🥺',
  '😴', '🤒', '🥳', '😎', '🤔'
];

const INTENSITY_LEVELS = ['Low', 'Medium', 'High'];

const MESSAGE_TEMPLATES = [
  'Thinking of you 💭',
  'Busy but okay 📱',
  'Need a hug 🤗',
  'Miss you ❤️',
  'Having a great day! ✨',
  'Feeling tired 😴'
];

export function UpdatePulseSheet({ isOpen, onClose, onUpdate, onOpenDoodle }: UpdatePulseSheetProps) {
  const [activeTab, setActiveTab] = useState<'mood' | 'message' | 'doodle'>('mood');
  const [selectedMood, setSelectedMood] = useState('');
  const [intensity, setIntensity] = useState('Medium');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const data: any = {};
    if (selectedMood) {
      data.mood = selectedMood;
      data.intensity = intensity;
    }
    if (message) {
      data.message = message;
    }
    onUpdate(data);
    onClose();
    // Reset
    setSelectedMood('');
    setMessage('');
    setIntensity('Medium');
  };

  const handleTemplateClick = (template: string) => {
    setMessage(template);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Update Aimo Pulse">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex space-x-2 bg-accent/50 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('mood')}
            className={`flex-1 py-2 px-4 rounded-xl transition-all ${
              activeTab === 'mood'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            <Smile className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">Mood</span>
          </button>
          <button
            onClick={() => setActiveTab('message')}
            className={`flex-1 py-2 px-4 rounded-xl transition-all ${
              activeTab === 'message'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            <MessageCircle className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">Message</span>
          </button>
          <button
            onClick={() => setActiveTab('doodle')}
            className={`flex-1 py-2 px-4 rounded-xl transition-all ${
              activeTab === 'doodle'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            <Palette className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">Doodle</span>
          </button>
        </div>

        {/* Mood Tab */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            {/* Mood Grid */}
            <div>
              <label className="text-sm font-medium mb-3 block">Select Mood</label>
              <div className="grid grid-cols-5 gap-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`aspect-square text-4xl rounded-2xl transition-all ${
                      selectedMood === mood
                        ? 'bg-[image:var(--pulse-gradient)] scale-110 shadow-lg'
                        : 'bg-accent hover:bg-accent/80 hover:scale-105'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            {selectedMood && (
              <div>
                <label className="text-sm font-medium mb-3 block">Intensity</label>
                <div className="flex space-x-2">
                  {INTENSITY_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setIntensity(level)}
                      className={`flex-1 py-3 rounded-xl transition-all ${
                        intensity === level
                          ? 'bg-[image:var(--pulse-gradient)] text-white shadow-md'
                          : 'bg-accent hover:bg-accent/80'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Tab */}
        {activeTab === 'message' && (
          <div className="space-y-6">
            {/* Message Input */}
            <div>
              <label className="text-sm font-medium mb-3 block">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={120}
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-input-background dark:bg-input border-2 border-transparent focus:border-[#A83FFF] focus:outline-none resize-none"
              />
              <div className="text-right text-sm text-muted-foreground mt-2">
                {message.length}/120
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="text-sm font-medium mb-3 block">Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_TEMPLATES.map((template) => (
                  <button
                    key={template}
                    onClick={() => handleTemplateClick(template)}
                    className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-full text-sm transition-all"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Doodle Tab */}
        {activeTab === 'doodle' && (
          <div className="text-center space-y-4 py-8">
            <div className="text-6xl">🎨</div>
            <div>
              <h3 className="font-semibold mb-2">Create a Doodle</h3>
              <p className="text-sm text-muted-foreground">
                Draw something special for your partner
              </p>
            </div>
            <Button
              variant="gradient"
              onClick={() => {
                onClose();
                onOpenDoodle();
              }}
              className="w-full"
            >
              Open Canvas
            </Button>
          </div>
        )}

        {/* Send Button */}
        {activeTab !== 'doodle' && (
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={handleSend}
            disabled={!selectedMood && !message}
          >
            Send to Today Card
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}