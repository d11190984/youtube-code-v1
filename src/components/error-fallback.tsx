"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
  message?: string;
}

export const ErrorFallback = ({
  resetErrorBoundary,
  title = "Đã xảy ra lỗi",
  message = "Chúng tôi không thể tải nội dung này vào lúc này. Vui lòng thử lại sau.",
}: ErrorFallbackProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20 text-center space-y-4">
      <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          {message}
        </p>
      </div>
      {resetErrorBoundary && (
        <Button 
          variant="outline" 
          onClick={resetErrorBoundary}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Thử lại
        </Button>
      )}
    </div>
  );
};
