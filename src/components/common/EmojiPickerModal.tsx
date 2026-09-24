import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentEmoji: string;
}

const GAME_EMOJIS = [
  // Currencies & Treasures
  '🪙', '💎', '💰', '💵', '💳', '🏆', '👑', '⭐', '✨', '⚡', '🗝️', '🔑', '🏷️', '🎁', '📦', '🔮',
  // Boosters & Stats
  '🚀', '🔥', '🔋', '🛡️', '⚔️', '🏹', '🧪', '💊', '🎯', '💥', '⏳', '⏱️', '📈', '🕹️', '🎲', '🎰',
  // Consumables & Lives
  '💖', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤍', '🍎', '🍕', '🍔', '☕', '🥤', '🍗', '🍬', '🎂',
  // Skins, Avatars & Characters
  '🛹', '🏎️', '🚗', '🏍️', '🛸', '🤖', '👾', '👻', '🐱', '🐶', '🦊', '🦁', '🐉', '🦄', '🧢', '🕶️',
  // Game Actions & Sinks
  '🔨', '🔧', '⚙️', '🏗️', '⛏️', '🧲', '🧰', '💣', '🧨', '🎪', '🏰', '🏝️', '🌋', '🌌', '🌠', '🎇',
];

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentEmoji,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl shadow-black/80 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentEmoji || '🎮'}</span>
            <h3 className="text-base font-semibold text-slate-100">Select Game Icon</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Or paste any custom emoji..."
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="button"
            disabled={!customEmoji}
            onClick={() => {
              if (customEmoji) {
                onSelect(customEmoji);
                onClose();
              }
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Use
          </button>
        </div>

        {/* Grid of game emojis */}
        <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
          {GAME_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className={`text-2xl p-2.5 rounded-xl hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all flex items-center justify-center ${
                currentEmoji === emoji ? 'bg-indigo-600/30 border border-indigo-500/50' : 'bg-slate-800/40'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="text-right border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
