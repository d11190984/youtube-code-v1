import { Link } from "@/i18n/routing";
import { useAuth } from "@clerk/nextjs";
import { useTranslations, useLocale } from "next-intl";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

interface UserSearchCardProps {
  data: {
    id: string;
    clerkId: string;
    name: string;
    imageUrl: string;
    subscriberCount: number;
    videoCount: number;
    bio?: string | null;
  };
}

export const UserSearchCard = ({ data }: UserSearchCardProps) => {
  const { userId } = useAuth();
  const isOwner = userId === data.clerkId;
  const t = useTranslations("Profile");
  const tVideo = useTranslations("Video");
  const locale = useLocale();

  return (
    <Link prefetch href={`/users/${data.id}`} className="group w-full block mb-4">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition">
        
        {/* Avatar Area */}
        <div className="flex-shrink-0 w-32 sm:w-1/3 flex justify-center sm:justify-end">
          <UserAvatar 
            imageUrl={data.imageUrl} 
            name={data.name} 
            size="xl" 
            className="size-24 sm:size-32 transition-transform duration-300 group-hover:scale-105" 
          />
        </div>

        {/* Info Area */}
        <div className="flex-1 flex flex-col items-center sm:items-start min-w-0 py-2 text-center sm:text-left w-full sm:w-auto">
          <h3 className="text-xl font-medium line-clamp-1">{data.name}</h3>
          
          <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2">
            <span>{data.name}</span>
            <span className="hidden sm:inline">•</span>
            <span>{t("subscribers", { count: new Intl.NumberFormat(locale, { notation: "compact" }).format(data.subscriberCount) })}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{t("videos", { count: data.videoCount })}</span>
          </div>

          {data.bio && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2 max-w-xl">
              {data.bio}
            </p>
          )}

          {/* Sub button cho mobile */}
          {!isOwner && (
            <div className="mt-4 sm:hidden">
              <Button variant="secondary" className="rounded-full">{tVideo("subscribe")}</Button>
            </div>
          )}
        </div>

        {/* Sub button cho desktop */}
        {!isOwner && (
          <div className="hidden sm:flex flex-shrink-0 w-32 items-center justify-center self-center">
            <Button variant="secondary" className="rounded-full">{tVideo("subscribe")}</Button>
          </div>
        )}
      </div>
      <div className="w-full h-[1px] bg-neutral-200 dark:bg-neutral-800 my-2 block sm:hidden"></div>
    </Link>
  );
};
