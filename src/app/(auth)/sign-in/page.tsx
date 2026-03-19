"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Github, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignInPage() {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="space-y-1 pt-8">
                <CardTitle className="text-2xl font-bold tracking-tight text-center font-heading">
                    Welcome back
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground font-subheading">
                    Enter your credentials to access your account
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 px-8 pb-8">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200 group">
                        <Chrome className="mr-2 h-4 w-4 text-[#4285F4] group-hover:scale-110 transition-transform" />
                        Google
                    </Button>
                    <Button variant="outline" className="w-full bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200 group">
                        <Github className="mr-2 h-4 w-4 text-black group-hover:scale-110 transition-transform" />
                        GitHub
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <label 
                            htmlFor="email" 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Email
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="name@example.com" 
                                className="pl-10 h-11 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <label 
                                htmlFor="password" 
                                className="text-sm font-medium leading-none"
                            >
                                Password
                            </label>
                            <Link 
                                href="/forgot-password" 
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                id="password" 
                                type={showPassword ? "text" : "password"} 
                                className="pl-10 pr-10 h-11 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 py-1">
                        <Checkbox id="remember" className="border-gray-300 data-[state=checked]:bg-primary" />
                        <label
                            htmlFor="remember"
                            className="text-sm font-medium leading-none cursor-pointer"
                        >
                            Keep me signed in
                        </label>
                    </div>

                    <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all duration-300">
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl py-6 px-8">
                <div className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link 
                        href="/sign-up" 
                        className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        Create an account
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
