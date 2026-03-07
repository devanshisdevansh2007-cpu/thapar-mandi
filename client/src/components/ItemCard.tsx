import { Link } from "wouter";
import { api } from "@shared/routes";
import { z } from "zod";
import { Tag } from "lucide-react";

type Item = z.infer<typeof api.items.list.responses[200]>[0];

export function ItemCard({ item }: { item: Item }) {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(item.price);

  return (
    <Link href={`/item/${item.id}`} className="group block h-full">
      <div className="h-full glass-card overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
        <div className="aspect-[4/3] w-full relative overflow-hidden bg-white/40">
          <img 
            src={item.image || "https://images.unsplash.com/photo-1555529771-835f59bfc50c?w=800&q=80"} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555529771-835f59bfc50c?w=800&q=80";
            }}
          />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary flex items-center gap-1.5 shadow-sm">
            <Tag className="w-3 h-3" />
            {item.category}
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-foreground/70 text-sm line-clamp-2 mb-4 flex-1">
            {item.description}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/20">
            <span className="font-display font-extrabold text-xl text-primary">
              {formattedPrice}
            </span>
            <span className="text-xs font-medium text-foreground/60 bg-white/30 px-2 py-1 rounded-md">
              {item.seller ? item.seller.name.split(' ')[0] : 'Seller'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
