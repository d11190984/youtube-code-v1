"use client";

import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { format } from "date-fns";
import { vi, enUS, de, es, fr, ja, ko, zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import {
  MoreVerticalIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserXIcon,
  UserCheckIcon,
  SearchIcon,
} from "lucide-react";

import { trpc } from "@/trpc/client";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";

export const AdminUsersSection = () => {
  const t = useTranslations("Admin");
  const [search, setSearch] = useState("");

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("userManagement")}</h1>
          <p className="text-muted-foreground">{t("manageUserAccounts")}</p>
        </div>
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("searchPlaceholder")} 
            className="pl-10 rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Suspense fallback={<AdminUsersSkeleton />} key={search}>
        <ErrorBoundary fallback={<p>{t("errorLoadingUsers")}</p>}>
          <AdminUsersSuspense search={search} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

const AdminUsersSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
};

interface AdminUsersSuspenseProps {
  search: string;
}

const AdminUsersSuspense = ({ search }: AdminUsersSuspenseProps) => {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const { user: currentUser } = useUser();
  const [usersData] = trpc.admin.getUsers.useSuspenseQuery({ limit: 50, search });
  const utils = trpc.useUtils();

  const dateFnsLocale = {
    vi,
    en: enUS,
    de,
    es,
    fr,
    ja,
    ko,
    zh: zhCN,
  }[locale] || enUS;

  const [banUser, setBanUser] = useState<{ id: string, name: string } | null>(null);

  const updateUserStatus = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => {
      toast.success(t("userStatusUpdated"));
      utils.admin.getUsers.invalidate();
      setBanUser(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      <AlertDialog open={!!banUser} onOpenChange={(open) => !open && setBanUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmBanTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
       {t("confirmBanDesc", { name: banUser?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => banUser && updateUserStatus.mutate({ userId: banUser.id, banned: true })}
            >
              {t("banAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-md border bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-neutral-800/50">
              <TableHead className="min-w-[200px]">{t("tableUser")}</TableHead>
              <TableHead className="min-w-[120px]">{t("tableJoinedDate")}</TableHead>
              <TableHead className="min-w-[150px]">{t("tableHandle")}</TableHead>
              <TableHead className="min-w-[120px]">{t("tableStatus")}</TableHead>
              <TableHead className="min-w-[150px] text-center pr-32">{t("tableActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {usersData.items.map((user) => (
            <TableRow key={user.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar name={user.name} imageUrl={user.imageUrl} size="sm" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{user.id}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: dateFnsLocale })}
              </TableCell>
              <TableCell>
                <span className="text-sm text-blue-500 font-medium">@{user.handle || t("noHandle")}</span>
              </TableCell>
              <TableCell>
                {user.banned ? (
                  <Badge variant="destructive" className="gap-1">
                    <ShieldAlertIcon className="size-3" />
                    {t("statusBanned")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                    <ShieldCheckIcon className="size-3" />
                    {t("statusActive")}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center pr-32">
                {currentUser?.id !== user.clerkId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => window.open(`/users/${user.id}`, '_blank')}>
                        <SearchIcon className="size-4 mr-2" />
                        {t("viewChannel")}
                      </DropdownMenuItem>
                      {user.banned ? (
                        <DropdownMenuItem onClick={() => updateUserStatus.mutate({ userId: user.id, banned: false })}>
                          <UserCheckIcon className="size-4 mr-2 text-green-500" />
                          {t("unbanAccount")}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          className="text-red-600 font-bold"
                          onClick={() => setBanUser({ id: user.id, name: user.name })}
                        >
                          <UserXIcon className="size-4 mr-2" />
                          {t("banAccount")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </div>
    </>
  );
};
