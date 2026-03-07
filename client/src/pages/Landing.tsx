import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useItems } from "@/hooks/use-items";
import { ItemCard } from "@/components/ItemCard";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Package } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export function Landing() {
  const { data: items, isLoading } = useItems();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const recentItems = items?.slice(0, 6) || [];

  if (authLoading) return null;

  return (
    <AppLayout>
      <div className="flex flex-col gap-16 pb-12">
        {/* Hero Section */}
        <section className="relative pt-12 md:pt-24 pb-16 md:pb-32 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-sm border border-white/30 text-primary font-semibold text-sm mb-4">
              <ShoppingBag className="w-4 h-4" />
              <span>Exclusive to Thapar University Students</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground leading-[1.1]">
              Buy and sell within <br/>
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#ff7a3d]">
                Thapar Campus
              </span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              The ultimate marketplace for Thaparians. Sell your old books, find a cycle, or grab deals on electronics from your peers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link 
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                Join Marketplace
              </Link>
              <Link 
                href="/marketplace"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-card text-foreground border border-white/40 hover:bg-white/40 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Browse Items
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Featured Items Preview */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">Fresh Listings</h2>
              <p className="text-foreground/70 mt-2">Recently added by students on campus</p>
            </div>
            <Link 
              href="/marketplace"
              className="hidden sm:flex items-center gap-2 font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-80 glass-card animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <ItemCard item={item as any} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 glass-card rounded-3xl">
              <Package className="w-12 h-12 text-primary/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No items yet</h3>
              <p className="text-foreground/70">Be the first to list something!</p>
            </div>
          )}

          <div className="sm:hidden text-center pt-4">
            <Link 
              href="/marketplace"
              className="inline-flex items-center gap-2 font-bold text-primary"
            >
              View all items <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
