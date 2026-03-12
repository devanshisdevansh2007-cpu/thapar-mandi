import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { Store, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const loginSchema = api.auth.login.input;
const registerSchema = api.auth.signup.input;

export function Auth({ isLogin = true }: { isLogin?: boolean }) {
  const { user, login, register, isLoggingIn, isRegistering, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isAuthLoading, setLocation]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

const registerForm = useForm<z.infer<typeof registerSchema>>({
  resolver: zodResolver(registerSchema),
  defaultValues: { 
    name: "", 
    email: "", 
    phoneNumber: "", 
    hostel: "", 
    password: "", 
    confirmPassword: "" 
  }
});

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data);
      toast({ title: "Welcome back!" });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      await register(data);
      toast({ title: "Account created successfully!" });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    }
  };

  if (isAuthLoading || user) return null;

  const isPending = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-card opacity-50 blur-3xl" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-primary text-primary-foreground p-3 rounded-2xl group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
              <Store className="w-8 h-8" />
            </div>
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-foreground mb-2">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-foreground/70 font-medium">
            {isLogin ? "Enter your details to access your account" : "Join the Thapar campus marketplace"}
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-2xl">
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground pl-1">Email</label>
                <input 
                  type="email" 
                  className="w-full glass-input px-4 py-3 rounded-xl outline-none"
                  placeholder="name@thapar.edu"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-destructive text-sm font-medium pl-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground pl-1">Password</label>
                <input 
                  type="password" 
                  className="w-full glass-input px-4 py-3 rounded-xl outline-none"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-destructive text-sm font-medium pl-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground pl-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full glass-input px-4 py-3 rounded-xl outline-none"
                  placeholder="John Doe"
                  {...registerForm.register("name")}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-destructive text-sm font-medium pl-1">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground pl-1">Thapar Email</label>
                <input 
                  type="email" 
                  className="w-full glass-input px-4 py-3 rounded-xl outline-none"
                  placeholder="jdoe_be21@thapar.edu"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-destructive text-sm font-medium pl-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
             <div className="space-y-2">
  <label className="text-sm font-bold text-foreground pl-1">Phone Number</label>
  <input 
    type="tel" 
    className="w-full glass-input px-4 py-3 rounded-xl outline-none"
    placeholder="9876543210"
    {...registerForm.register("phoneNumber")}
  />
  {registerForm.formState.errors.phoneNumber && (
    <p className="text-destructive text-sm font-medium pl-1">
      {registerForm.formState.errors.phoneNumber.message}
    </p>
  )}
</div>

<div className="space-y-2">
  <label className="text-sm font-bold text-foreground pl-1">Hostel</label>

  <select
    className="w-full glass-input px-4 py-3 rounded-xl outline-none"
    {...registerForm.register("hostel")}
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

  {registerForm.formState.errors.hostel && (
    <p className="text-destructive text-sm font-medium pl-1">
      {registerForm.formState.errors.hostel.message}
    </p>
  )}
</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground pl-1">Password</label>
                  <input 
                    type="password" 
                    className="w-full glass-input px-4 py-3 rounded-xl outline-none"
                    placeholder="••••••••"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-destructive text-xs font-medium pl-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground pl-1">Confirm</label>
                  <input 
                    type="password" 
                    className="w-full glass-input px-4 py-3 rounded-xl outline-none"
                    placeholder="••••••••"
                    {...registerForm.register("confirmPassword")}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-destructive text-xs font-medium pl-1">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm font-medium text-foreground/80">
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-bold">Sign up</Link>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-bold">Log in</Link>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
