"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PlaylistCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên danh sách"),
  visibility: z.enum(["public", "private"]).default("private"),
});

export const PlaylistCreateModal = ({
  open,
  onOpenChange,
}: PlaylistCreateModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      visibility: "private",
    },
  });

  const utils = trpc.useUtils();

  const createPlaylist = trpc.playlists.create.useMutation({
    onSuccess: () => {
      utils.playlists.getMany.invalidate();
      toast.success("Tạo danh sách phát thành công!");
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Đã xảy ra lỗi");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPlaylist.mutate({
      name: values.name,
      visibility: values.visibility,
    });
  };

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        visibility: "private",
      });
    }
  }, [open, form]);

  return (
    <ResponsiveModal
      title="Tạo danh sách phát"
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên danh sách</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ví dụ: Video yêu thích" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quyền riêng tư</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="border rounded px-2 py-2 w-full"
                  >
                    <option value="private">Riêng tư</option>
                    <option value="public">Công khai</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={createPlaylist.isPending}>
              Tạo
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  );
};
