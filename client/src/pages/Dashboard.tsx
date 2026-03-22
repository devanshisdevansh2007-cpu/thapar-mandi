import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Store, PlusCircle, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
export function Dashboard() {
  const { user, isLoading } = useAuth();
 const [, setLocation] = useLocation();

  // 🔥 IMPORTANT: useEffect redirect (not inline)
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading]);

  if (isLoading || !user) return null;

const [hostel, setHostel] = useState(user?.hostel || "");
  const updateHostel = async () => {
  await fetch("/api/user/hostel", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ hostel }),
  });

 window.location.reload();
};
  const actions = [
    {
      title: "Browse Marketplace",
      description: "Find books, cycles, and more",
      icon: Store,
      href: "/marketplace",
      color: "bg-white/40",
      textColor: "text-primary"
    },
    {
      title: "Sell an Item",
      description: "List something you want to sell",
      icon: PlusCircle,
      href: "/sell",
      color: "bg-primary",
      textColor: "text-primary-foreground"
    },
    {
      title: "My Listings",
      description: "Manage your active items",
      icon: Package,
      href: "/my-listings",
      color: "bg-card border border-white/40",
      textColor: "text-foreground"
    }
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-12 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-12 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            Welcome back, <span className="text-primary">{user.name ? user.name.split(' ')[0] : ""}</span>! 👋
          </h1>
          <p className="text-lg text-foreground/80 font-medium max-w-xl">
            What would you like to do today? You can browse items posted by other students or list your own.
          </p>
        </motion.div>
<div className="glass-card p-6 rounded-2xl">
  <label className="text-sm font-bold text-foreground block mb-2">
    Update Your Hostel
  </label>

  <div className="flex gap-3">
    <select
      value={hostel}
      onChange={(e) => setHostel(e.target.value)}
      className="glass-input px-4 py-2 rounded-xl outline-none flex-1"
    >
      <option value="">Select Hostel</option>
      <option value="M">M</option>
      <option value="J">J</option>
      <option value="H">H</option>
      <option value="K">K</option>
      <option value="A">A</option>
      <option value="B">B</option>
      <option value="C">C</option>
      <option value="D">D</option>
      <option value="O">O</option>
      <option value="Q">Q</option>
      <option value="G">G</option>
      <option value="I">I</option>
      <option value="E">E</option>
      <option value="N">N</option>
      <option value="FRG">FRG</option>
      <option value="FRF">FRF</option>
    </select>

    <button
      onClick={updateHostel}
      className="bg-primary text-primary-foreground px-4 py-2 rounded-xl"
    >
      Update
    </button>
  </div>
</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actions.map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={action.href} className="block h-full">
                <div className={`h-full p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-lg ${action.color} group relative overflow-hidden`}>
                  <action.icon className={`w-10 h-10 mb-6 ${action.textColor}`} />
                  <h3 className={`text-xl font-bold font-display mb-2 ${action.textColor}`}>
                    {action.title}
                  </h3>
                  <p className={`${action.textColor} opacity-80 font-medium`}>
                    {action.description}
                  </p>
                  <ArrowRight className={`absolute bottom-8 right-8 w-6 h-6 ${action.textColor} opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
