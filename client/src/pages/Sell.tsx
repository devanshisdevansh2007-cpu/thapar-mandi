import { AppLayout } from "@/components/layout/AppLayout";
import { useCreateItem } from "@/hooks/use-items";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import imageCompression from "browser-image-compression";

const formSchema = api.items.create.input.extend({
  price: z.coerce.number().positive("Price must be greater than 0"),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORIES = [
  "Books",
  "Electronics",
  "Vehicles",
  "Furniture",
  "Stationery",
  "Other",
];

export function Sell() {
  const { mutateAsync: createItem, isPending } = useCreateItem();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 700,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error(error);
      return file;
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "" as any,
      category: "Books",
      image: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createItem(data);
      toast({ title: "Item listed successfully!" });
      setLocation("/my-listings");
    } catch (err: any) {
      toast({
        title: "Failed to list item",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const imagePreview = form.watch("image");

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-extrabold text-foreground mb-2">
            Sell an Item
          </h1>
          <p className="text-foreground/70 font-medium text-lg">
            Provide details about what you're selling.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-10 rounded-3xl shadow-xl"
        >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground pl-1">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full glass-input px-4 py-3 rounded-xl outline-none"
                    placeholder="e.g. Engineering Mathematics Book"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-destructive text-sm font-medium pl-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground pl-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full glass-input px-4 py-3 rounded-xl outline-none font-semibold"
                      placeholder="500"
                      {...form.register("price")}
                    />
                    {form.formState.errors.price && (
                      <p className="text-destructive text-xs font-medium pl-1">
                        {form.formState.errors.price.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground pl-1">
                      Category
                    </label>
                    <select
                      className="w-full glass-input px-4 py-3 rounded-xl outline-none appearance-none"
                      {...form.register("category")}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.category && (
                      <p className="text-destructive text-xs font-medium pl-1">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground pl-1">
                    Upload Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    className="w-full glass-input px-4 py-3 rounded-xl outline-none"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      console.log("Original size:", file.size);

                      const compressed = await compressImage(file);

                      console.log("Compressed size:", compressed.size);

                      const reader = new FileReader();
                      reader.onloadend = () => {
                        form.setValue("image", reader.result as string);
                      };
                      reader.readAsDataURL(compressed);
                    }}
                  />

                  <p className="text-xs text-foreground/60 pl-1 font-medium">
                    Select a photo from your gallery or camera.
                  </p>
                  {form.formState.errors.image && (
                    <p className="text-destructive text-sm font-medium pl-1">
                      {form.formState.errors.image.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6 flex flex-col">
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-sm font-bold text-foreground pl-1">
                    Description
                  </label>
                  <textarea
                    className="w-full flex-1 glass-input px-4 py-3 rounded-xl outline-none min-h-[120px] resize-none"
                    placeholder="Describe condition, reason for selling, etc..."
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-destructive text-sm font-medium pl-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                {/* Preview Box */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground pl-1">
                    Image Preview
                  </label>
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-white/40 border border-white/50 flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display =
                            "block";
                        }}
                      />
                    ) : (
                      <span className="text-foreground/40 font-medium flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8" />
                        No image provided
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/20">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ml-auto"
              >
                {isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-6 h-6" /> List Item
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AppLayout>
  );
}
