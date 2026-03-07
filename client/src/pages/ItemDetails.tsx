import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useItem } from "@/hooks/use-items";
import { useAuth } from "@/hooks/use-auth";
import { Phone, Copy, Check, ArrowLeft, ShieldCheck, Tag, Loader2, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export function ItemDetails() {
  const params = useParams();
  const itemId = parseInt(params.id || "0");
  const { data: item, isLoading } = useItem(itemId);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showPhone, setShowPhone] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="text-center py-24 glass-card rounded-3xl max-w-2xl mx-auto mt-12">
          <h2 className="text-3xl font-display font-bold mb-4">Item not found</h2>
          <Link href="/marketplace" className="text-primary font-bold hover:underline">
            ← Back to Marketplace
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isOwner = user?.id === item.sellerId;
  const seller = item.seller;

  const handleCopyPhone = () => {
    if (!seller) return;
    navigator.clipboard.writeText(seller.phoneNumber);
    setCopied(true);
    toast({ title: "Phone number copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(item.price);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-6">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary font-semibold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl overflow-hidden glass-card aspect-square lg:aspect-[4/5] bg-white/40 shadow-xl"
          >
            <img 
              src={item.image || "https://images.unsplash.com/photo-1555529771-835f59bfc50c?w=1000&q=80"} 
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555529771-835f59bfc50c?w=1000&q=80";
              }}
            />
          </motion.div>

          {/* Details Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/50 text-primary font-bold text-sm shadow-sm border border-white/50">
                <Tag className="w-4 h-4" />
                {item.category}
              </span>
              <span className="text-sm font-medium text-foreground/60">
                Listed {new Date(item.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4 leading-tight">
              {item.title}
            </h1>
            
            <div className="text-4xl font-display font-black text-primary mb-8">
              {formattedPrice}
            </div>

            <div className="glass-card p-6 rounded-2xl mb-8 space-y-4 shadow-sm border border-white/30">
              <h3 className="font-bold text-lg border-b border-white/20 pb-3">Description</h3>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                {item.description}
              </p>
            </div>

            {/* Seller Info & Action */}
            <div className="mt-auto glass-card p-6 md:p-8 rounded-3xl shadow-xl border-2 border-white/40">
              {isOwner ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UserIcon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">This is your listing</h3>
                  <Link href="/my-listings" className="inline-block bg-white/50 text-foreground font-bold px-6 py-3 rounded-xl hover:bg-white/70 transition-colors">
                    Manage Listing
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/60 rounded-full flex items-center justify-center shadow-inner">
                      <UserIcon className="w-7 h-7 text-primary/70" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-0.5">Seller</p>
                      <p className="text-xl font-bold text-foreground">{seller?.name}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-primary text-sm font-bold bg-white/40 px-3 py-1.5 rounded-lg border border-white/50">
                      <ShieldCheck className="w-4 h-4" />
                      Verified
                    </div>
                  </div>

                  {showPhone ? (
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex items-center justify-between bg-white/60 border-2 border-primary/20 p-4 rounded-xl shadow-inner">
                        <span className="text-2xl font-display font-bold tracking-widest text-foreground">
                          {seller?.phoneNumber}
                        </span>
                        <button 
                          onClick={handleCopyPhone}
                          className="p-3 bg-white hover:bg-primary hover:text-primary-foreground text-primary rounded-xl shadow-sm transition-all"
                          title="Copy Number"
                        >
                          {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                        </button>
                      </div>
                      <p className="text-sm text-center font-medium text-foreground/60">
                        Please mention you found this on Thapar Mandi when calling.
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowPhone(true)}
                      className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-3 mt-2"
                    >
                      <Phone className="w-5 h-5" />
                      Contact Seller
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
