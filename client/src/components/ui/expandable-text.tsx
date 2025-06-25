
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  maxLines?: number;
  className?: string;
  showToggleButton?: boolean;
  previewMode?: "characters" | "lines";
}

export function ExpandableText({
  text,
  maxLength = 150,
  maxLines = 3,
  className,
  showToggleButton = true,
  previewMode = "characters"
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if text needs truncation
  const needsTruncation = previewMode === "characters" 
    ? text.length > maxLength
    : text.split('\n').length > maxLines;

  // Get preview text
  const getPreviewText = () => {
    if (previewMode === "characters") {
      return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
    } else {
      const lines = text.split('\n');
      return lines.length > maxLines ? lines.slice(0, maxLines).join('\n') + "..." : text;
    }
  };

  const displayText = isExpanded || !needsTruncation ? text : getPreviewText();

  if (!needsTruncation && !showToggleButton) {
    return (
      <div className={cn("whitespace-pre-wrap break-words", className)}>
        {text}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="whitespace-pre-wrap break-words">
        {displayText}
      </div>
      
      {needsTruncation && showToggleButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Voir plus
            </>
          )}
        </Button>
      )}
    </div>
  );
}
