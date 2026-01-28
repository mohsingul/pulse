import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EnhancedEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  feelings: {
    label: 'Feelings',
    emojis: ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔', '🫡'],
  },
  love: {
    label: 'Love',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '😍', '🥰', '😘', '😗', '😙', '😚', '😽', '💋', '💌', '💑', '💏', '👩‍❤️‍👨', '💐', '🌹'],
  },
  energy: {
    label: 'Energy',
    emojis: ['⚡', '✨', '💫', '🌟', '⭐', '🌠', '🔥', '💥', '🎉', '🎊', '🎈', '🎆', '🎇', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌊', '💪', '🦾', '🚀', '🎯', '🏆', '🥇', '🎖️', '🏅', '⚽', '🏀', '🎸', '🎵', '🎶', '🎤'],
  },
  comfort: {
    label: 'Comfort',
    emojis: ['🤗', '🥺', '😌', '😊', '🫂', '💆', '💆‍♀️', '💆‍♂️', '🛀', '🧘', '🧘‍♀️', '🧘‍♂️', '😴', '😪', '🥱', '😇', '🤲', '🙏', '☮️', '🕊️', '🤝', '👏', '🫶', '👐', '🙌', '✋', '👋', '🤚', '🫰', '☕', '🍵', '🛋️', '🌙', '⭐'],
  },
  moods: {
    label: 'Moods',
    emojis: ['😐', '😑', '😶', '🙄', '😏', '😒', '🙂', '😮', '😯', '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫', '🤯', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '🙁', '☹️', '😬', '🤐', '🤨', '😳', '🥴', '😶‍🌫️'],
  },
  stress: {
    label: 'Stress',
    emojis: ['😰', '😥', '😓', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '😱', '😨', '😧', '😦', '😮', '😯', '😲', '😵', '🤯', '😳', '🥵', '🥶', '😶‍🌫️', '💔'],
  },
  playful: {
    label: 'Playful',
    emojis: ['😜', '😝', '😛', '🤪', '😋', '🤑', '🤓', '😎', '🥳', '🤩', '🥸', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷'],
  },
  thinking: {
    label: 'Thinking',
    emojis: ['🤔', '🤨', '🧐', '🤓', '😑', '😐', '😶', '🫥', '😶‍🌫️', '🙄', '😏', '🤭', '🤫', '🤥', '😬', '🫣', '🫢', '🫡', '💭', '💡', '🧠', '🤯', '🫠', '🙃', '🧑‍💻', '📝', '📚', '🎓', '💼', '🔍', '🔎', '🗝️'],
  },
};

type CategoryKey = keyof typeof EMOJI_CATEGORIES;

export function EnhancedEmojiPicker({ onSelect, onClose }: EnhancedEmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('feelings');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold">Pick a Mood</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-2 px-6 py-4 overflow-x-auto border-b border-border">
          {(Object.keys(EMOJI_CATEGORIES) as CategoryKey[]).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-[image:var(--pulse-gradient)] text-white shadow-lg'
                  : 'bg-accent text-foreground hover:bg-accent/80'
              }`}
            >
              {EMOJI_CATEGORIES[category].label}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
            {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className="aspect-square flex items-center justify-center text-4xl sm:text-5xl hover:bg-accent rounded-2xl transition-all hover:scale-110 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
