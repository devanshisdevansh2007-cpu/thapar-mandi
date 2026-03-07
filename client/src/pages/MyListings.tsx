import { AppLayout } from "@/components/layout/AppLayout";
import { useMyListings, useDeleteItem, useUpdateItem } from "@/hooks/use-items";
import { Link } from "wouter";
import { Edit2, Trash2, Package, Loader2, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";

const updateSchema = api.items.update.input.extend({
  price: z.coerce.number().positive()
});
type UpdateFormValues = z.infer<typeof updateSchema>;

export function MyListings() {
  const { data: items, isLoading } = useMyListings();
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateItem();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema)
  });

  const startEdit = (item: any) => {
    form.reset({
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
    });
    setEditingId(item.id);
  };

  const handleUpdate = async (data: UpdateFormValues) => {
    if (!editingId) return;
    try {
      await updateItem({ id: editingId, updates: data });
      toast({ title: "Item updated successfully!" });
      setEditingId(null);
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteItem(id);
      toast({ title: "Item deleted." });
      setDeleteConfirmId(null);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="py-6 space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-display font-extrabold text-foreground mb-2">My Listings</h1>
            <p className="text-foreground/70 font-medium">Manage the items you're selling.</p>
          </div>
          <Link href="/sell" className="hidden sm:flex bg-white/40 text-foreground font-bold px-6 py-2.5 rounded-xl hover:bg-white/60 transition-colors border border-white/50 shadow-sm">
            Post New Item
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="flex flex-col gap-6">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  className="glass-card p-4 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center md:items-start shadow-md"
                >
                  <div className="w-full md:w-48 aspect-video md:aspect-square bg-white/40 rounded-2xl overflow-hidden shrink-0 border border-white/50">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555529771-835f59bfc50c?w=400&q=80";
                      }}
                    />
                  </div>

                  {editingId === item.id ? (
                    <form onSubmit={form.handleSubmit(handleUpdate)} className="flex-1 w-full space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input {...form.register("title")} className="glass-input px-3 py-2 rounded-lg" placeholder="Title" />
                        <input type="number" {...form.register("price")} className="glass-input px-3 py-2 rounded-lg" placeholder="Price" />
                        <select {...form.register("category")} className="glass-input px-3 py-2 rounded-lg">
                          {["Books", "Electronics", "Vehicles", "Furniture", "Stationery", "Other"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input {...form.register("image")} className="glass-input px-3 py-2 rounded-lg" placeholder="Image URL" />
                      </div>
                      <textarea {...form.register("description")} className="glass-input px-3 py-2 rounded-lg w-full min-h-[80px]" placeholder="Description" />
                      
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 font-bold text-foreground/70 hover:bg-white/40 rounded-xl transition-colors">
                          Cancel
                        </button>
                        <button type="submit" disabled={isUpdating} className="px-6 py-2 font-bold bg-primary text-primary-foreground rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex-1 w-full flex flex-col h-full justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <Link href={`/item/${item.id}`}>
                            <h3 className="text-2xl font-display font-bold hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                          </Link>
                          <span className="text-xl font-black text-primary shrink-0">₹{item.price}</span>
                        </div>
                        <p className="text-foreground/70 font-medium line-clamp-2 mb-2">{item.description}</p>
                        <span className="inline-block px-2 py-1 bg-white/50 text-xs font-bold text-primary rounded-md">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex justify-end items-center gap-3 pt-4 border-t border-white/20">
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-2 bg-destructive/10 p-2 rounded-xl border border-destructive/20">
                            <span className="text-sm font-bold text-destructive px-2">Delete this?</span>
                            <button onClick={() => setDeleteConfirmId(null)} className="p-2 bg-white/50 hover:bg-white rounded-lg transition-colors">
                              <X className="w-4 h-4 text-foreground" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} disabled={isDeleting} className="p-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg transition-colors flex items-center gap-1">
                              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => startEdit(item)}
                              className="px-4 py-2 flex items-center gap-2 font-bold bg-white/40 hover:bg-white/60 text-foreground rounded-xl transition-colors border border-white/50"
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="px-4 py-2 flex items-center gap-2 font-bold bg-white/40 hover:bg-destructive hover:text-destructive-foreground text-destructive rounded-xl transition-colors border border-white/50"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24 glass-card rounded-3xl max-w-2xl mx-auto">
            <Package className="w-16 h-16 text-primary/50 mx-auto mb-6" />
            <h3 className="text-2xl font-display font-bold text-foreground mb-4">No active listings</h3>
            <p className="text-foreground/70 font-medium text-lg mb-8">
              You haven't listed any items for sale yet.
            </p>
            <Link 
              href="/sell"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground shadow-xl hover:-translate-y-1 transition-transform"
            >
              Post your first item
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
