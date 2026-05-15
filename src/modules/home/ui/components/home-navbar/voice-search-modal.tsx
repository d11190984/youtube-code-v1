"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { MicIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface VoiceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
 
const speechLocales: Record<string, string> = {
  vi: "vi-VN",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
};

export const VoiceSearchModal = ({ open, onOpenChange }: VoiceSearchModalProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const t = useTranslations("VoiceSearch");
  const locale = useLocale();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError(t("unsupported"));
      return;
    }

    if (open) {
      setTranscript("");
      setInterimTranscript("");
      setError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Tắt continuous để giảm lỗi network
      recognition.interimResults = true;
      recognition.lang = speechLocales[locale] || "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + final + " ");
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {

        
        // Mạng đôi khi bị lỗi tạm thời, chúng ta sẽ không báo lỗi ngay lập tức nếu đã có kết quả
        if (event.error === "network") {
          if (!transcript && !interimTranscript) {
            setError(t("networkError"));
          }
        } else if (event.error === "not-allowed") {
          setError(t("micBlocked"));
        } else if (event.error !== "no-speech") {
          setError(t("genericError"));
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {

      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [open]);

  const handleDone = () => {
    const finalQuery = (transcript + interimTranscript).trim();
    if (finalQuery) {
      const params = new URLSearchParams();
      params.set("query", finalQuery);
      router.push(`/search?${params.toString()}`);
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveModal
      title={t("title")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col items-center justify-center p-8 min-h-[300px] gap-8">
        <div className={`text-2xl font-medium text-center min-h-[3rem] px-4 ${error ? "text-red-500" : ""}`}>
          {error || transcript || interimTranscript || (isRecording ? t("listening") : t("tryAgain"))}
        </div>

        <div className="relative">
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          )}
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "secondary"}
            className="size-20 rounded-full shadow-lg relative z-10"
            onClick={() => {
              if (isRecording) {
                recognitionRef.current?.stop();
              } else {
                recognitionRef.current?.start();
              }
            }}
          >
            <MicIcon className="size-10" />
          </Button>
        </div>

        <div className="flex gap-4 w-full max-w-xs">
          <Button 
            variant="outline" 
            className="flex-1 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button 
            variant="default" 
            className="flex-1 rounded-full"
            onClick={handleDone}
            disabled={!(transcript || interimTranscript)}
          >
            {t("done")}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};
