'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';

/**
 * Emoji Picker Component
 * A custom emoji picker that supports searching, categories, and recent emoji tracking.
 */

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

// Custom search icon component
const SearchIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    style={{ width: '20px', height: '20px', aspectRatio: '1/1' }}
  >
    <path
      d="M16.0443 16.0423L12.9193 12.9173M3.96094 9.16732C3.96094 6.29083 6.29279 3.95898 9.16927 3.95898C12.0458 3.95898 14.3776 6.29083 14.3776 9.16732C14.3776 12.0438 12.0458 14.3757 9.16927 14.3757C6.29279 14.3757 3.96094 12.0438 3.96094 9.16732Z"
      stroke={Neutral.N300}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Define emoji category interfaces
interface Emoji {
  emoji: string;
  label: string;
  tags?: string[];
  version?: string;
}

interface EmojiCategory {
  id: string;
  label: string;
  emojis: Emoji[];
}

export function EmojiPicker({ onSelect, className }: EmojiPickerProps): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [emojiCategories, setEmojiCategories] = useState<EmojiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      // Apply custom styles for the viewport
      viewportRef.current.style.maxHeight = '240px';
      viewportRef.current.style.overflowY = 'scroll';
      viewportRef.current.style.overflowX = 'hidden';
      viewportRef.current.style.paddingRight = '8px'; // Increased padding to 8px
      viewportRef.current.style.scrollbarWidth = 'none'; // Hide Firefox scrollbar
    }
  }, []);

  // Recent emojis state - stored in localStorage
  const [recentEmojis, setRecentEmojis] = React.useState<string[]>(() => {
    // Default emoji set
    const defaultEmojis = ['😀', '👍', '❤️', '👏', '🎉', '🔥', '😊', '✨', '🙏', '👋', '😂', '🤔'];

    // Try to get from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recent-emojis');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to load recent emojis from localStorage', e);
      }
    }

    return defaultEmojis;
  });

  // Search state
  const [isSearching, setIsSearching] = React.useState(false);

  // Initialize emoji categories with hardcoded data instead of using frimousse
  React.useEffect(() => {
    // Use a hardcoded set of common emojis
    const defaultCategories: EmojiCategory[] = [
      {
        id: 'smileys-emotion',
        label: 'Smileys & Emotion',
        emojis: [
          { emoji: '😀', label: 'Grinning Face' },
          { emoji: '😃', label: 'Grinning Face with Big Eyes' },
          { emoji: '😄', label: 'Grinning Face with Smiling Eyes' },
          { emoji: '😁', label: 'Beaming Face with Smiling Eyes' },
          { emoji: '😆', label: 'Grinning Squinting Face' },
          { emoji: '😊', label: 'Smiling Face with Smiling Eyes' },
          { emoji: '😇', label: 'Smiling Face with Halo' },
          { emoji: '🙂', label: 'Slightly Smiling Face' },
          { emoji: '🙃', label: 'Upside-Down Face' },
          { emoji: '😉', label: 'Winking Face' },
          { emoji: '😌', label: 'Relieved Face' },
          { emoji: '😍', label: 'Smiling Face with Heart-Eyes' },
          { emoji: '🥰', label: 'Smiling Face with Hearts' },
          { emoji: '😘', label: 'Face Blowing a Kiss' },
          { emoji: '😗', label: 'Kissing Face' },
          { emoji: '😙', label: 'Kissing Face with Smiling Eyes' },
          { emoji: '😚', label: 'Kissing Face with Closed Eyes' },
          { emoji: '🤗', label: 'Hugging Face' },
          { emoji: '🤩', label: 'Star-Struck' },
          { emoji: '🥳', label: 'Partying Face' },
          { emoji: '😏', label: 'Smirking Face' },
          { emoji: '😒', label: 'Unamused Face' },
          { emoji: '😞', label: 'Disappointed Face' },
          { emoji: '😔', label: 'Pensive Face' },
          { emoji: '😟', label: 'Worried Face' },
          { emoji: '😕', label: 'Confused Face' },
          { emoji: '🙁', label: 'Slightly Frowning Face' },
          { emoji: '☹️', label: 'Frowning Face' },
          { emoji: '😣', label: 'Persevering Face' },
          { emoji: '😖', label: 'Confounded Face' },
          { emoji: '😫', label: 'Tired Face' },
          { emoji: '😩', label: 'Weary Face' },
        ],
      },
      {
        id: 'people-body',
        label: 'People & Body',
        emojis: [
          { emoji: '👍', label: 'Thumbs Up' },
          { emoji: '👎', label: 'Thumbs Down' },
          { emoji: '👏', label: 'Clapping Hands' },
          { emoji: '🙌', label: 'Raising Hands' },
          { emoji: '🙏', label: 'Folded Hands' },
          { emoji: '👋', label: 'Waving Hand' },
          { emoji: '✌️', label: 'Victory Hand' },
          { emoji: '🤞', label: 'Crossed Fingers' },
          { emoji: '👊', label: 'Oncoming Fist' },
          { emoji: '👌', label: 'OK Hand' },
          { emoji: '🤝', label: 'Handshake' },
          { emoji: '👨', label: 'Man' },
          { emoji: '👩', label: 'Woman' },
          { emoji: '👶', label: 'Baby' },
          { emoji: '👴', label: 'Old Man' },
          { emoji: '👵', label: 'Old Woman' },
          { emoji: '🧑', label: 'Person' },
          { emoji: '👦', label: 'Boy' },
          { emoji: '👧', label: 'Girl' },
          { emoji: '👨‍👩‍👦', label: 'Family' },
          { emoji: '👪', label: 'Family' },
          { emoji: '👨‍👨‍👦', label: 'Family: Man, Man, Boy' },
          { emoji: '👩‍👩‍👦', label: 'Family: Woman, Woman, Boy' },
          { emoji: '💪', label: 'Flexed Biceps' },
          { emoji: '🦵', label: 'Leg' },
          { emoji: '🦶', label: 'Foot' },
          { emoji: '👈', label: 'Backhand Index Pointing Left' },
          { emoji: '👉', label: 'Backhand Index Pointing Right' },
          { emoji: '👆', label: 'Backhand Index Pointing Up' },
          { emoji: '👇', label: 'Backhand Index Pointing Down' },
          { emoji: '✋', label: 'Raised Hand' },
          { emoji: '🤚', label: 'Raised Back of Hand' },
        ],
      },
      {
        id: 'animals-nature',
        label: 'Animals & Nature',
        emojis: [
          { emoji: '🐶', label: 'Dog Face' },
          { emoji: '🐱', label: 'Cat Face' },
          { emoji: '🐭', label: 'Mouse Face' },
          { emoji: '🐹', label: 'Hamster' },
          { emoji: '🐰', label: 'Rabbit Face' },
          { emoji: '🦊', label: 'Fox' },
          { emoji: '🐻', label: 'Bear' },
          { emoji: '🐼', label: 'Panda' },
          { emoji: '🐨', label: 'Koala' },
          { emoji: '🐯', label: 'Tiger Face' },
          { emoji: '🦁', label: 'Lion' },
          { emoji: '🐮', label: 'Cow Face' },
          { emoji: '🐷', label: 'Pig Face' },
          { emoji: '🐸', label: 'Frog' },
          { emoji: '🐵', label: 'Monkey Face' },
          { emoji: '🐔', label: 'Chicken' },
          { emoji: '🐧', label: 'Penguin' },
          { emoji: '🐦', label: 'Bird' },
          { emoji: '🐤', label: 'Baby Chick' },
          { emoji: '🦄', label: 'Unicorn' },
          { emoji: '🐝', label: 'Honeybee' },
          { emoji: '🦋', label: 'Butterfly' },
          { emoji: '🐢', label: 'Turtle' },
          { emoji: '🐍', label: 'Snake' },
          { emoji: '🦖', label: 'T-Rex' },
          { emoji: '🦕', label: 'Sauropod' },
          { emoji: '🐙', label: 'Octopus' },
          { emoji: '🦑', label: 'Squid' },
          { emoji: '🦐', label: 'Shrimp' },
          { emoji: '🦀', label: 'Crab' },
          { emoji: '🐬', label: 'Dolphin' },
          { emoji: '🐳', label: 'Spouting Whale' },
        ],
      },
      {
        id: 'food-drink',
        label: 'Food & Drink',
        emojis: [
          { emoji: '🍎', label: 'Red Apple' },
          { emoji: '🍐', label: 'Pear' },
          { emoji: '🍊', label: 'Tangerine' },
          { emoji: '🍋', label: 'Lemon' },
          { emoji: '🍌', label: 'Banana' },
          { emoji: '🍉', label: 'Watermelon' },
          { emoji: '🍇', label: 'Grapes' },
          { emoji: '🍓', label: 'Strawberry' },
          { emoji: '🍈', label: 'Melon' },
          { emoji: '🍒', label: 'Cherries' },
          { emoji: '🍑', label: 'Peach' },
          { emoji: '🥭', label: 'Mango' },
          { emoji: '🍍', label: 'Pineapple' },
          { emoji: '🥥', label: 'Coconut' },
          { emoji: '🥝', label: 'Kiwi Fruit' },
          { emoji: '🍅', label: 'Tomato' },
          { emoji: '🍆', label: 'Eggplant' },
          { emoji: '🥑', label: 'Avocado' },
          { emoji: '🥦', label: 'Broccoli' },
          { emoji: '🥬', label: 'Leafy Green' },
          { emoji: '🍞', label: 'Bread' },
          { emoji: '🥐', label: 'Croissant' },
          { emoji: '🥨', label: 'Pretzel' },
          { emoji: '🍔', label: 'Hamburger' },
          { emoji: '🍟', label: 'French Fries' },
          { emoji: '🍕', label: 'Pizza' },
          { emoji: '🌭', label: 'Hot Dog' },
          { emoji: '🍿', label: 'Popcorn' },
          { emoji: '🍩', label: 'Doughnut' },
          { emoji: '🍪', label: 'Cookie' },
          { emoji: '🎂', label: 'Birthday Cake' },
          { emoji: '🍰', label: 'Shortcake' },
        ],
      },
      {
        id: 'travel-places',
        label: 'Travel & Places',
        emojis: [
          { emoji: '🚗', label: 'Automobile' },
          { emoji: '🚕', label: 'Taxi' },
          { emoji: '🚙', label: 'Sport Utility Vehicle' },
          { emoji: '🚌', label: 'Bus' },
          { emoji: '🚎', label: 'Trolleybus' },
          { emoji: '🏎️', label: 'Racing Car' },
          { emoji: '🚓', label: 'Police Car' },
          { emoji: '🚑', label: 'Ambulance' },
          { emoji: '🚒', label: 'Fire Engine' },
          { emoji: '🚚', label: 'Delivery Truck' },
          { emoji: '🚛', label: 'Articulated Lorry' },
          { emoji: '🚜', label: 'Tractor' },
          { emoji: '🛴', label: 'Kick Scooter' },
          { emoji: '🚲', label: 'Bicycle' },
          { emoji: '🛵', label: 'Motor Scooter' },
          { emoji: '🏍️', label: 'Motorcycle' },
          { emoji: '✈️', label: 'Airplane' },
          { emoji: '🚀', label: 'Rocket' },
          { emoji: '🛸', label: 'Flying Saucer' },
          { emoji: '🚁', label: 'Helicopter' },
          { emoji: '🛶', label: 'Canoe' },
          { emoji: '⛵', label: 'Sailboat' },
          { emoji: '🚢', label: 'Ship' },
          { emoji: '🏠', label: 'House' },
          { emoji: '🏡', label: 'House with Garden' },
          { emoji: '🏢', label: 'Office Building' },
          { emoji: '🏣', label: 'Japanese Post Office' },
          { emoji: '🏥', label: 'Hospital' },
          { emoji: '🏦', label: 'Bank' },
          { emoji: '🏨', label: 'Hotel' },
          { emoji: '🏪', label: 'Convenience Store' },
          { emoji: '🏫', label: 'School' },
        ],
      },
      {
        id: 'activities',
        label: 'Activities',
        emojis: [
          { emoji: '⚽', label: 'Soccer Ball' },
          { emoji: '🏀', label: 'Basketball' },
          { emoji: '🏈', label: 'American Football' },
          { emoji: '⚾', label: 'Baseball' },
          { emoji: '🥎', label: 'Softball' },
          { emoji: '🎾', label: 'Tennis' },
          { emoji: '🏐', label: 'Volleyball' },
          { emoji: '🏉', label: 'Rugby Football' },
          { emoji: '🥏', label: 'Flying Disc' },
          { emoji: '🎱', label: 'Pool 8 Ball' },
          { emoji: '🏓', label: 'Ping Pong' },
          { emoji: '🏸', label: 'Badminton' },
          { emoji: '🏒', label: 'Ice Hockey' },
          { emoji: '🏑', label: 'Field Hockey' },
          { emoji: '🥍', label: 'Lacrosse' },
          { emoji: '🏏', label: 'Cricket Game' },
          { emoji: '⛳', label: 'Flag in Hole' },
          { emoji: '🎣', label: 'Fishing Pole' },
          { emoji: '🎽', label: 'Running Shirt' },
          { emoji: '🛹', label: 'Skateboard' },
          { emoji: '🎮', label: 'Video Game' },
          { emoji: '🎲', label: 'Game Die' },
          { emoji: '🎭', label: 'Performing Arts' },
          { emoji: '🎨', label: 'Artist Palette' },
          { emoji: '🧩', label: 'Puzzle Piece' },
          { emoji: '♟️', label: 'Chess Pawn' },
          { emoji: '🎯', label: 'Direct Hit' },
          { emoji: '🎳', label: 'Bowling' },
          { emoji: '🎪', label: 'Circus Tent' },
          { emoji: '🎬', label: 'Clapper Board' },
          { emoji: '🎤', label: 'Microphone' },
          { emoji: '🎧', label: 'Headphone' },
        ],
      },
      {
        id: 'objects',
        label: 'Objects',
        emojis: [
          { emoji: '⌚', label: 'Watch' },
          { emoji: '📱', label: 'Mobile Phone' },
          { emoji: '💻', label: 'Laptop' },
          { emoji: '⌨️', label: 'Keyboard' },
          { emoji: '🖥️', label: 'Desktop Computer' },
          { emoji: '🖨️', label: 'Printer' },
          { emoji: '🖱️', label: 'Computer Mouse' },
          { emoji: '💽', label: 'Computer Disk' },
          { emoji: '💾', label: 'Floppy Disk' },
          { emoji: '💿', label: 'Optical Disk' },
          { emoji: '📀', label: 'DVD' },
          { emoji: '📷', label: 'Camera' },
          { emoji: '📹', label: 'Video Camera' },
          { emoji: '🎥', label: 'Movie Camera' },
          { emoji: '📺', label: 'Television' },
          { emoji: '📻', label: 'Radio' },
          { emoji: '🔋', label: 'Battery' },
          { emoji: '🔌', label: 'Electric Plug' },
          { emoji: '💡', label: 'Light Bulb' },
          { emoji: '🔦', label: 'Flashlight' },
          { emoji: '📚', label: 'Books' },
          { emoji: '📖', label: 'Open Book' },
          { emoji: '📰', label: 'Newspaper' },
          { emoji: '📝', label: 'Memo' },
          { emoji: '✏️', label: 'Pencil' },
          { emoji: '✒️', label: 'Black Nib' },
          { emoji: '🖋️', label: 'Fountain Pen' },
          { emoji: '🖊️', label: 'Pen' },
          { emoji: '🖌️', label: 'Paintbrush' },
          { emoji: '🖍️', label: 'Crayon' },
          { emoji: '📅', label: 'Calendar' },
          { emoji: '📆', label: 'Tear-Off Calendar' },
        ],
      },
      {
        id: 'symbols',
        label: 'Symbols',
        emojis: [
          { emoji: '❤️', label: 'Red Heart' },
          { emoji: '🧡', label: 'Orange Heart' },
          { emoji: '💛', label: 'Yellow Heart' },
          { emoji: '💚', label: 'Green Heart' },
          { emoji: '💙', label: 'Blue Heart' },
          { emoji: '💜', label: 'Purple Heart' },
          { emoji: '🖤', label: 'Black Heart' },
          { emoji: '🤍', label: 'White Heart' },
          { emoji: '🤎', label: 'Brown Heart' },
          { emoji: '💔', label: 'Broken Heart' },
          { emoji: '❣️', label: 'Heart Exclamation' },
          { emoji: '💕', label: 'Two Hearts' },
          { emoji: '💞', label: 'Revolving Hearts' },
          { emoji: '💓', label: 'Beating Heart' },
          { emoji: '💗', label: 'Growing Heart' },
          { emoji: '💖', label: 'Sparkling Heart' },
          { emoji: '💘', label: 'Heart with Arrow' },
          { emoji: '💝', label: 'Heart with Ribbon' },
          { emoji: '💟', label: 'Heart Decoration' },
          { emoji: '☮️', label: 'Peace Symbol' },
          { emoji: '✝️', label: 'Latin Cross' },
          { emoji: '☪️', label: 'Star and Crescent' },
          { emoji: '🕉️', label: 'Om' },
          { emoji: '☸️', label: 'Wheel of Dharma' },
          { emoji: '✡️', label: 'Star of David' },
          { emoji: '🔯', label: 'Dotted Six-Pointed Star' },
          { emoji: '🕎', label: 'Menorah' },
          { emoji: '☯️', label: 'Yin Yang' },
          { emoji: '☦️', label: 'Orthodox Cross' },
          { emoji: '🛐', label: 'Place of Worship' },
          { emoji: '⚛️', label: 'Atom Symbol' },
          { emoji: '✨', label: 'Sparkles' },
        ],
      },
      {
        id: 'flags',
        label: 'Flags',
        emojis: [
          { emoji: '🏁', label: 'Chequered Flag' },
          { emoji: '🚩', label: 'Triangular Flag' },
          { emoji: '🎌', label: 'Crossed Flags' },
          { emoji: '🏴', label: 'Black Flag' },
          { emoji: '🏳️', label: 'White Flag' },
          { emoji: '🏳️‍🌈', label: 'Rainbow Flag' },
          { emoji: '🏳️‍⚧️', label: 'Transgender Flag' },
          { emoji: '🇦🇫', label: 'Afghanistan' },
          { emoji: '🇦🇽', label: 'Åland Islands' },
          { emoji: '🇦🇱', label: 'Albania' },
          { emoji: '🇩🇿', label: 'Algeria' },
          { emoji: '🇦🇸', label: 'American Samoa' },
          { emoji: '🇦🇩', label: 'Andorra' },
          { emoji: '🇦🇴', label: 'Angola' },
          { emoji: '🇦🇮', label: 'Anguilla' },
          { emoji: '🇦🇶', label: 'Antarctica' },
          { emoji: '🇦🇬', label: 'Antigua & Barbuda' },
          { emoji: '🇦🇷', label: 'Argentina' },
          { emoji: '🇦🇲', label: 'Armenia' },
          { emoji: '🇦🇼', label: 'Aruba' },
          { emoji: '🇦🇺', label: 'Australia' },
          { emoji: '🇦🇹', label: 'Austria' },
          { emoji: '🇦🇿', label: 'Azerbaijan' },
          { emoji: '🇧🇸', label: 'Bahamas' },
          { emoji: '🇧🇭', label: 'Bahrain' },
          { emoji: '🇧🇩', label: 'Bangladesh' },
          { emoji: '🇧🇧', label: 'Barbados' },
          { emoji: '🇧🇾', label: 'Belarus' },
          { emoji: '🇧🇪', label: 'Belgium' },
          { emoji: '🇧🇿', label: 'Belize' },
          { emoji: '🇧🇯', label: 'Benin' },
          { emoji: '🇧🇲', label: 'Bermuda' },
        ],
      },
    ];

    setEmojiCategories(defaultCategories);
    setIsLoading(false);
  }, []);

  // Filter emojis when searching
  const filteredEmojis = React.useMemo(() => {
    if (!searchTerm) {
      return [];
    }

    const query = searchTerm.toLowerCase();
    return emojiCategories.flatMap((category) =>
      category.emojis.filter(
        (emoji) =>
          emoji.label.toLowerCase().includes(query) ||
          emoji.emoji.includes(query) ||
          (emoji.tags && emoji.tags.some((tag) => tag.toLowerCase().includes(query)))
      )
    );
  }, [searchTerm, emojiCategories]);

  // Custom handler for emoji selection
  const handleEmojiSelect = (emoji: Emoji | string) => {
    const emojiStr = typeof emoji === 'string' ? emoji : emoji.emoji;

    // Add emoji to recent emojis
    const newRecents = [emojiStr, ...recentEmojis.filter((e) => e !== emojiStr)].slice(0, 12); // Keep only 12 recent emojis (2 rows of 6)

    setRecentEmojis(newRecents);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('recent-emojis', JSON.stringify(newRecents));
      } catch (e) {
        console.error('Failed to save recent emojis to localStorage', e);
      }
    }

    // Clear search after selection
    setSearchTerm('');
    setIsSearching(false);

    // Call the original onSelect
    onSelect(emojiStr);
  };

  // Custom handler for clicking a recent emoji
  const handleRecentEmojiClick = (emoji: string) => {
    // Update the recents list to move this emoji to the front
    const newRecents = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 12); // Keep only 12 recent emojis (2 rows of 6)

    setRecentEmojis(newRecents);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('recent-emojis', JSON.stringify(newRecents));
      } catch (e) {
        console.error('Failed to save recent emojis to localStorage', e);
      }
    }

    // Call the original onSelect
    onSelect(emoji);
  };

  // Apply emoji button styles and scrollbar styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `      
      .emoji-button {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        width: 32px;
        font-size: 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.15s ease;
        background-color: transparent;
      }
      
      /* Category header styling */
      .emoji-category-header, .emoji-recent-header {
        font-size: 14px !important;
        line-height: 20px !important;
        font-weight: 400 !important;
        font-family: sans-serif !important;
        color: ${CoreColors.Black} !important;
        margin-bottom: 6px !important;
      }
      
      /* Grid layout */
      .emoji-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
        margin-bottom: 12px;
        padding-right: 8px; /* Add padding to avoid content touching scrollbar */
      }
      
      /* Section styling */
      .emoji-section {
        margin-bottom: 16px;
      }
      
      /* Search input styling */
      .emoji-search {
        color: ${Neutral.N400};
        transition: color 0.15s ease;
      }
      
      .emoji-search:focus {
        color: ${CoreColors.Black} !important;
      }
      
      /* Custom Scrollbar Implementation */
      .emoji-viewport {
        overflow-y: scroll !important;
        max-height: 240px !important;
        
        /* Hide default scrollbar for Firefox */
        scrollbar-width: none;
      }
      
      /* Hide default scrollbar for Webkit browsers */
      .emoji-viewport::-webkit-scrollbar {
        display: none;
      }
      
      /* Custom scrollbar track */
      .emoji-viewport-container {
        position: relative;
        padding: 12px 8px 12px 12px !important;
        box-sizing: border-box;
        overflow: hidden;
      }
      
      /* Custom scrollbar track and thumb */
      .emoji-viewport-container::after {
        content: "";
        position: absolute;
        top: 18px; /* Align with the Recent header */
        right: 7px; /* Move 4px to the right from 3px */
        width: 6px;
        height: calc(100% - 36px); /* Adjust for new top position */
        background-color: transparent;
        border-radius: 3px;
        pointer-events: auto; /* Enable interaction with the track */
        cursor: pointer; /* Show a pointer cursor */
      }
      
      /* Create a custom scrollbar thumb */
      .emoji-viewport::after {
        content: "";
        position: absolute;
        top: 6px; /* Align with the Recent header */
        right: 4px; /* Move 4px to the right from 0px */
        width: 6px;
        height: var(--scrollbar-thumb-height, 30%);
        transform: translateY(var(--scrollbar-thumb-pos, 0));
        background-color: ${Neutral.N300};
        border-radius: 3px;
        opacity: 1; /* Always visible */
        pointer-events: auto; /* Enable interaction with the thumb */
        cursor: grab; /* Show grab cursor */
        max-height: calc(100% - 12px); /* Ensure it never extends beyond bottom padding */
      }
      
      /* Recent emojis row */
      .emoji-recent-grid {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 8px;
        margin-bottom: 16px;
        scrollbar-width: none; /* Hide scrollbar for Firefox */
      }
      
      .emoji-recent-grid::-webkit-scrollbar {
        display: none; /* Hide scrollbar for Chrome/Safari */
      }
      
      /* Loading state */
      .emoji-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100px;
        color: ${Neutral.N400};
      }
      
      /* Emoji button hover/active states - placed at end to ensure they take precedence */
      .emoji-viewport .emoji-button:hover {
        background-color: ${Neutral.N100} !important;
      }
      
      .emoji-viewport .emoji-button:active {
        background-color: ${Neutral.N400} !important;
      }
    `;
    document.head.appendChild(style);

    // Custom scrollbar handler
    const viewport = viewportRef.current;
    if (viewport) {
      // Track element reference
      const viewportContainer = viewport.parentElement;
      if (!viewportContainer) return;

      // Function to update the scrollbar thumb position and height
      const updateScrollThumb = () => {
        const { scrollTop, scrollHeight, clientHeight } = viewport;

        // Use 18px padding (6px top + 12px bottom)
        const adjustedClientHeight = clientHeight - 18;
        const thumbHeight = Math.max(
          40,
          (adjustedClientHeight / scrollHeight) * adjustedClientHeight
        );
        viewport.style.setProperty('--scrollbar-thumb-height', `${thumbHeight}px`);

        // Calculate thumb position with consideration for the larger viewport
        const scrollableHeight = scrollHeight - clientHeight;
        const scrollRatio = scrollTop / (scrollableHeight || 1); // Avoid division by zero
        const thumbTrackHeight = adjustedClientHeight - thumbHeight;

        // Calculate position but ensure it never goes below the bottom padding area
        let thumbPos = scrollRatio * thumbTrackHeight + 6; // Add the top padding offset

        // Ensure the thumb doesn't extend past the bottom padding
        const maxThumbPos = clientHeight - thumbHeight - 12; // Subtract bottom padding
        thumbPos = Math.min(thumbPos, maxThumbPos);

        viewport.style.setProperty('--scrollbar-thumb-pos', `${thumbPos}px`);
      };

      // Add support for dragging the scrollbar thumb
      let isDragging = false;
      let startY = 0;
      let startScrollTop = 0;

      // Function to handle scrollbar thumb drag start
      const handleMouseDown = (e: MouseEvent) => {
        // Check if click is on the track or thumb area
        const rect = viewportContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Only handle if click is in scrollbar area
        if (x >= rect.width - 20) {
          e.preventDefault();
          isDragging = true;

          // If clicking directly on the thumb area
          const y = e.clientY - rect.top;
          const thumbPos =
            parseFloat(viewport.style.getPropertyValue('--scrollbar-thumb-pos')) || 0;
          const thumbHeight =
            parseFloat(viewport.style.getPropertyValue('--scrollbar-thumb-height')) || 40;

          // Check if click is on the thumb or track
          if (y >= thumbPos && y <= thumbPos + thumbHeight) {
            // Clicking on thumb - start dragging
            startY = e.clientY;
            startScrollTop = viewport.scrollTop;
          } else {
            // Clicking on track - jump to position
            const trackHeight = viewportContainer.clientHeight - 18; // Adjust for padding (6px top + 12px bottom)
            const trackY = y - 6; // Adjust for top padding
            const scrollRatio = trackY / trackHeight;
            viewport.scrollTop = scrollRatio * (viewport.scrollHeight - viewport.clientHeight);
            updateScrollThumb();
          }

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);

          // Change cursor while dragging
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'grabbing';
        }
      };

      // Function to handle scrollbar thumb dragging
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaY = e.clientY - startY;
        const trackHeight = viewportContainer.clientHeight - 64; // Adjust for padding
        const scrollRatio = deltaY / trackHeight;
        const scrollDelta = scrollRatio * (viewport.scrollHeight - viewport.clientHeight);

        viewport.scrollTop = startScrollTop + scrollDelta;
        updateScrollThumb();
      };

      // Function to handle scrollbar thumb drag end
      const handleMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Reset cursor
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      // Add event listeners
      viewport.addEventListener('scroll', updateScrollThumb);
      viewportContainer.addEventListener('mousedown', handleMouseDown);

      // Initial update
      setTimeout(updateScrollThumb, 100);

      return () => {
        document.head.removeChild(style);
        viewport.removeEventListener('scroll', updateScrollThumb);
        viewportContainer.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      className={cn(
        'isolate flex flex-col bg-white dark:bg-neutral-900 overflow-hidden w-fit max-h-[300px] rounded-xl border border-[#E5E5E5]',
        className
      )}
      style={{
        boxShadow: `0px 4px 8px 0px rgba(0, 0, 0, 0.06)`,
        borderRadius: '12px',
        backgroundColor: CoreColors.White,
        borderColor: Neutral.N200,
        width: '264px', // 6 emoji buttons (32px each) + 5 gaps (8px each) + padding (12px left + 8px right) + scrollbar space
      }}
    >
      <div className="flex flex-col h-full">
        {/* Search Bar */}
        <div
          className="flex justify-between items-center self-stretch px-[10px] pr-2 py-3 border-b border-[#E5E5E5] bg-white dark:bg-neutral-900 rounded-t-xl"
          style={{
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            backgroundColor: CoreColors.White,
            borderColor: Neutral.N200,
          }}
        >
          <div className="flex items-center flex-1">
            <SearchIcon />
            <input
              className="appearance-none bg-transparent ml-2 w-full outline-none emoji-search"
              placeholder="Search..."
              style={{
                ...textStyles.body2Reg,
              }}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearching(e.target.value.length > 0);
              }}
            />
          </div>
        </div>

        {/* Scrollable content with custom styling */}
        <div className="flex-1 relative overflow-hidden emoji-viewport-container">
          <div className="emoji-viewport" ref={viewportRef}>
            {isLoading ? (
              <div className="emoji-loading">Loading emojis...</div>
            ) : isSearching ? (
              // Search results
              <div className="emoji-section">
                <div className="text-neutral-600 emoji-recent-header" style={textStyles.body2Reg}>
                  Search Results
                </div>
                {filteredEmojis.length > 0 ? (
                  <div className="emoji-grid">
                    {filteredEmojis.map((emoji, index) => (
                      <button
                        key={`search-${index}`}
                        className="emoji-button"
                        onClick={() => handleEmojiSelect(emoji)}
                        title={emoji.label}
                      >
                        {emoji.emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-neutral-400 text-sm py-2"
                    style={{ color: Neutral.N400, ...textStyles.body2Reg }}
                  >
                    No emoji found.
                  </div>
                )}
              </div>
            ) : (
              // Regular emoji display
              <>
                {/* Recent Emojis Section */}
                {recentEmojis.length > 0 && (
                  <div className="emoji-section">
                    <div
                      className="text-neutral-600 emoji-recent-header"
                      style={textStyles.body2Reg}
                    >
                      Recent
                    </div>
                    <div className="emoji-recent-grid">
                      {recentEmojis.slice(0, 6).map((emoji, index) => (
                        <button
                          key={`recent-${index}`}
                          className="emoji-button"
                          onClick={() => handleRecentEmojiClick(emoji)}
                          style={{ flex: '0 0 auto' }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories from frimousse */}
                {emojiCategories.map((category) => (
                  <div className="emoji-section" key={category.id}>
                    <div
                      className="text-neutral-600 emoji-category-header"
                      style={textStyles.body2Reg}
                    >
                      {category.label}
                    </div>
                    <div className="emoji-grid">
                      {category.emojis.map((emoji, index) => (
                        <button
                          key={`${category.id}-${index}`}
                          className="emoji-button"
                          onClick={() => handleEmojiSelect(emoji)}
                          title={emoji.label}
                        >
                          {emoji.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
