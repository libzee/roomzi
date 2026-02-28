import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Smile, Paperclip } from 'lucide-react';

const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'],
  'Food & Drink': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯'],
  'Activities': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥊', '🥋', '🥅', '⛳️', '⛸️', '🎣', '🤿', '🎽', '🛹', '🛷', '⛷️', '🏂', '🏋️‍♀️', '🤼‍♀️', '🤸‍♀️'],
  'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄'],
  'Objects': ['⌚️', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👍', '👎', '👊', '✊', '🤛', '🤜'],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onFileButtonClick?: () => void;
}

export function EmojiPicker({ onEmojiSelect, onFileButtonClick }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2">
          <Button variant="outline" size="sm" className="mb-2 w-full" onClick={onFileButtonClick}>
            <span className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attach File
            </span>
          </Button>
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} className="mb-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">{category}</h3>
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onEmojiSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 