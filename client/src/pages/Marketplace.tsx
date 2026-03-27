  import { AppLayout } from "@/components/layout/AppLayout";
  import { useItems } from "@/hooks/use-items";
  import { ItemCard } from "@/components/ItemCard";
  import { Search, Loader2, PackageX } from "lucide-react";
  import { motion } from "framer-motion";
  import { useState, useEffect } from "react"; // 🔥 ADD useEffect
  export function Marketplace() {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
  const isSearching = searchTerm !== debouncedSearch;
    // Simple debounce
   useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
  
    return () => clearTimeout(handler);
  }, [searchTerm]);
  
    const { data: items, isLoading } = useItems(debouncedSearch || undefined);
  
    return (
      <AppLayout>
        <div className="space-y-8 py-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-extrabold text-foreground mb-2">Marketplace</h1>
              <p className="text-foreground/70 font-medium">Discover items from students across campus.</p>
            </div>
  
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
              <input 
                type="text"
                placeholder="Search for books, cycles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full glass-input pl-12 pr-10 py-3 rounded-2xl outline-none font-medium shadow-sm"
              />
              {isSearching && (
    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
  )}
            </div>
          </div>
  
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : items && items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.5) }}
                >
                  <ItemCard item={item as any} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 glass-card rounded-3xl max-w-2xl mx-auto">
              <PackageX className="w-16 h-16 text-primary/50 mx-auto mb-6" />
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">No items found</h3>
              <p className="text-foreground/70 font-medium text-lg">
                {debouncedSearch ? "Try adjusting your search terms." : "The marketplace is empty right now."}
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }
