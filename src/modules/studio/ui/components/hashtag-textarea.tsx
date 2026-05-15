"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import { useDebounce } from "@/hooks/use-debounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HashIcon } from "lucide-react";

interface HashtagTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange: (value: string) => void;
}

export const HashtagTextarea = ({ value, onValueChange, ...props }: HashtagTextareaProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState("");
  const debouncedQuery = useDebounce(hashtagQuery, 200);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: suggestions = [] } = trpc.search.getTagSuggestions.useQuery(
    { query: debouncedQuery },
    { enabled: showSuggestions }
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onValueChange(newValue);

    const position = e.target.selectionStart;
    setCursorPos(position);

    // Detect hashtag
    const textBeforeCursor = newValue.substring(0, position);
    const lastWord = textBeforeCursor.split(/\s/).pop();

    if (lastWord?.startsWith("#")) {
      setHashtagQuery(lastWord.substring(1));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (tag: string) => {
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    
    const words = textBeforeCursor.split(/\s/);
    words.pop(); // remove partial hashtag
    const newTextBefore = [...words, `#${tag}`].join(" ") + " ";
    
    onValueChange(newTextBefore + textAfterCursor);
    setShowSuggestions(false);
    
    // Reset focus
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = newTextBefore.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  return (
    <div className="relative">
      <Textarea
        {...props}
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={(e) => {
            if (e.key === "Escape") setShowSuggestions(false);
        }}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-md mt-1 w-64 max-h-48 overflow-y-auto">
          {!hashtagQuery && (
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-neutral-100 dark:border-neutral-800">
              Hashtag thịnh hành
            </div>
          )}
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => selectSuggestion(tag)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-left transition-colors"
            >
              <HashIcon className="size-3 text-muted-foreground" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
