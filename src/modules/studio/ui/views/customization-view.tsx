"use client";

import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Wand2Icon, 
  ImageIcon, 
  UserCircleIcon, 
  LinkIcon, 
  PlusIcon, 
  Trash2Icon, 
  CopyIcon,
  AlertCircleIcon
} from "lucide-react";
import { format } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { enUS, vi, ja, ko, zhCN, de, es, fr } from "date-fns/locale";

const dateFnsLocales = {
  en: enUS,
  vi: vi,
  ja: ja,
  ko: ko,
  zh: zhCN,
  de: de,
  es: es,
  fr: fr,
};

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { BannerUploadModal } from "@/modules/users/ui/components/banner-upload-modal";

export const CustomizationView = () => {
  const [user] = trpc.users.getCurrent.useSuspenseQuery();
  const utils = trpc.useUtils();
  const t = useTranslations("Studio");
  const tGeneral = useTranslations("General");
  const locale = useLocale();
  const dateLocale = dateFnsLocales[locale as keyof typeof dateFnsLocales] || vi;

  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle || "");
  const [bio, setBio] = useState(user.bio || "");
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const isHandleBlocked = !!(user.handlePreviousUpdatedAt && new Date(user.handlePreviousUpdatedAt) > fourteenDaysAgo);

  const updateChannel = trpc.users.updateChannel.useMutation({
    onSuccess: () => {
      toast.success(t("updateChannelSuccess"));
      utils.users.getCurrent.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    updateChannel.mutate({
      name,
      handle,
      bio,
    });
  };

  const hasChanges = name !== user.name || handle !== (user.handle || "") || bio !== (user.bio || "");

  return (
    <div className="flex flex-col gap-y-6 w-full max-w-5xl mx-auto px-4 py-8">
      <BannerUploadModal
        userId={user.id}
        open={isBannerModalOpen}
        onOpenChange={setIsBannerModalOpen}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("customization")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <Link href={`/users/${user.id}`} target="_blank">
              {t("viewChannel")}
            </Link>
          </Button>
          <Button variant="ghost" disabled={!hasChanges} onClick={() => {
            setName(user.name);
            setHandle(user.handle || "");
            setBio(user.bio || "");
          }}>{t("cancel")}</Button>
          <Button 
            disabled={!hasChanges || updateChannel.isPending} 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md px-6"
          >
            {t("publish")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-8">
          <TabsTrigger 
            value="profile" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm"
          >
            {t("profile")}
          </TabsTrigger>
          <TabsTrigger 
            value="branding" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm"
          >
            {t("branding")}
          </TabsTrigger>
          <TabsTrigger 
            value="home" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm"
          >
            {t("homeTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-6 space-y-8">
          {/* Section: Name */}
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-base font-bold">{t("name")}</h3>
            <p className="text-sm text-muted-foreground">{t("nameDescription")}</p>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            />
          </div>

          {/* Section: Handle */}
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-base font-bold">{t("handle")}</h3>
            <p className="text-sm text-muted-foreground">{t("handleDescription")}</p>
            
            {isHandleBlocked ? (
              <div className="flex items-start gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <AlertCircleIcon className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("handleLimitReached")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("handleLimitInfo", { date: format(new Date(new Date(user.handlePreviousUpdatedAt!).getTime() + 14 * 24 * 60 * 60 * 1000), "d 'thg' M, yyyy", { locale: dateLocale }) })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input 
                  value={handle} 
                  onChange={(e) => setHandle(e.target.value)}
                  className="pl-8 bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  placeholder={t("handlePlaceholder")}
                />
              </div>
            )}
            
            {!isHandleBlocked && (
              <p className="text-xs text-muted-foreground mt-1">https://youtube-code-v1.vercel.app/@{handle || "ten-nguoi-dung"}</p>
            )}
          </div>

          {/* Section: Bio */}
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-base font-bold">{t("description")}</h3>
            <p className="text-sm text-muted-foreground">{t("descriptionPlaceholder")}</p>
            <Textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[150px] bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          {/* Section: Links (Static placeholder for now) */}
          <div className="space-y-4 max-w-3xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold">{t("links")}</h3>
              <p className="text-sm text-muted-foreground">{t("linksDescription")}</p>
            </div>
            
            <Button variant="outline" className="rounded-full gap-2 text-blue-500 font-bold border-none hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <PlusIcon className="size-5" />
              {t("addLink")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="pt-6 space-y-10">
          {/* Avatar Upload */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-48 h-48 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border">
              <UserAvatar 
                imageUrl={user.imageUrl} 
                name={user.name} 
                className="w-full h-full"
              />
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-base font-bold">{t("picture")}</h3>
              <p className="text-sm text-muted-foreground">{t("pictureDescription")}</p>
              <div className="flex gap-4 pt-2">
                <Button variant="ghost" className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">{t("change")}</Button>
                <Button variant="ghost" className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">{t("remove")}</Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Banner Upload */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-[320px] aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex flex-col items-center justify-center overflow-hidden flex-shrink-0 border relative">
              {user.bannerUrl ? (
                <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="size-12 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-base font-bold">{t("banner")}</h3>
              <p className="text-sm text-muted-foreground">{t("bannerDescription")}</p>
              <div className="flex gap-4 pt-2">
                <Button 
                  variant="ghost" 
                  className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  onClick={() => setIsBannerModalOpen(true)}
                >
                  {t("change")}
                </Button>
                {user.bannerUrl && (
                  <Button variant="ghost" className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">{t("remove")}</Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="home" className="pt-6">
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed rounded-xl border-neutral-200 dark:border-neutral-800">
             <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full">
                <Wand2Icon className="size-8 text-muted-foreground" />
             </div>
             <div className="space-y-1">
                <p className="font-bold">{t("homeLayoutTitle")}</p>
                <p className="text-sm text-muted-foreground max-w-md">{t("homeLayoutDescription")}</p>
             </div>
             <Button className="rounded-full font-bold">{t("addSection")}</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
