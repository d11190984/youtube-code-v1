"use client";

import { useState } from "react";
import { XIcon, DeleteIcon, ArrowUpIcon, CornerDownLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VirtualKeyboardProps {
  onInput: (char: string) => void;
  onBackspace: () => void;
  onClose: () => void;
}

export const VirtualKeyboard = ({ onInput, onBackspace, onClose }: VirtualKeyboardProps) => {
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);

  const rows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
  ];

  const handleKeyClick = (key: string) => {
    let char = key;
    if (isShift || isCaps) {
      char = key.toUpperCase();
    }
    onInput(char);
    if (isShift) setIsShift(false);
  };

  return (
    <div className="bg-neutral-100 dark:bg-[#1f1f1f] p-2 sm:p-3 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-[95vw] sm:w-[550px] select-none animate-in fade-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-2 sm:mb-4 px-2">
        <span className="text-xs sm:text-sm font-bold text-neutral-500 uppercase tracking-wider">Tiếng Việt</span>
        <button onClick={onClose} className="hover:bg-neutral-200 dark:hover:bg-neutral-800 p-1 rounded-full transition">
          <XIcon className="size-3 sm:size-4 text-neutral-500" />
        </button>
      </div>

      <div className="grid gap-1 sm:gap-1.5">
        {/* Row 1 */}
        <div className="flex gap-1 sm:gap-1.5 justify-center">
          {rows[0].map((key) => (
            <Key key={key} char={key} onClick={() => handleKeyClick(key)} />
          ))}
          <Key 
            className="w-10 sm:w-16 bg-neutral-200 dark:bg-neutral-800" 
            onClick={onBackspace}
          >
            <DeleteIcon className="size-3 sm:size-4" />
          </Key>
        </div>

        {/* Row 2 */}
        <div className="flex gap-1 sm:gap-1.5 justify-center">
          <div className="hidden sm:block w-8" /> {/* Offset desktop */}
          {rows[1].map((key) => (
            <Key key={key} char={isShift || isCaps ? key.toUpperCase() : key} onClick={() => handleKeyClick(key)} />
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex gap-1 sm:gap-1.5 justify-center">
          <Key 
            className={`w-10 sm:w-16 text-[10px] sm:text-sm ${isCaps ? "bg-blue-500 text-white" : "bg-neutral-200 dark:bg-neutral-800"}`} 
            onClick={() => setIsCaps(!isCaps)}
          >
            Caps
          </Key>
          {rows[2].map((key) => (
            <Key key={key} char={isShift || isCaps ? key.toUpperCase() : key} onClick={() => handleKeyClick(key)} />
          ))}
          <Key className="w-10 sm:w-16 bg-neutral-200 dark:bg-neutral-800" onClick={() => onInput("\n")}>
            <CornerDownLeftIcon className="size-3 sm:size-4" />
          </Key>
        </div>

        {/* Row 4 */}
        <div className="flex gap-1 sm:gap-1.5 justify-center">
          <Key 
            className={`w-12 sm:w-20 ${isShift ? "bg-blue-500 text-white" : "bg-neutral-200 dark:bg-neutral-800"}`} 
            onClick={() => setIsShift(!isShift)}
          >
            <ArrowUpIcon className="size-3 sm:size-4" />
          </Key>
          {rows[3].map((key) => (
            <Key key={key} char={isShift || isCaps ? key.toUpperCase() : key} onClick={() => handleKeyClick(key)} />
          ))}
          <Key 
             className={`w-12 sm:w-20 ${isShift ? "bg-blue-500 text-white" : "bg-neutral-200 dark:bg-neutral-800"}`} 
             onClick={() => setIsShift(!isShift)}
          >
            <ArrowUpIcon className="size-3 sm:size-4" />
          </Key>
        </div>

        {/* Row 5 */}
        <div className="flex gap-1 sm:gap-1.5 justify-center mt-1">
           <Key className="w-full sm:w-[300px]" onClick={() => onInput(" ")}>
             Khoảng cách
           </Key>
        </div>
      </div>
    </div>
  );
};

interface KeyProps {
  char?: string;
  children?: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const Key = ({ char, children, onClick, className = "" }: KeyProps) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`
        h-7 w-7 sm:h-10 sm:w-10 flex items-center justify-center rounded-sm sm:rounded-md text-[10px] sm:text-sm font-medium
        bg-white dark:bg-neutral-700 
        hover:bg-neutral-200 dark:hover:bg-neutral-600
        active:scale-95 transition-all shadow-sm border border-neutral-200 dark:border-neutral-600
        ${className}
      `}
    >
      {char || children}
    </button>
  );
};
