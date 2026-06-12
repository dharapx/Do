"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";
import { PasswordComplexity, isPasswordValid } from "@/components/ui/password-complexity";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"username" | "action" | "reset">("username");
  const [username, setUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  const [displayedCode, setDisplayedCode] = useState<string | null>(null);

  const passwordValid = isPasswordValid(newPassword);
  const canReset = resetCode.trim() && newPassword.trim() && passwordValid && !loading;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your username");
      return;
    }
    setLoading(true);
    try {
      const resp = await authApi.forgotPassword(username.trim());
      if (resp.has_oauth_providers) {
        setOauthProviders(resp.oauth_providers);
        setStep("action");
      } else if (resp.reset_code) {
        setDisplayedCode(resp.reset_code);
        setStep("reset");
        toast.success("Reset code generated");
      } else {
        toast.success(resp.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    try {
      const { url } = await authApi.getOAuthUrl(provider as "github" | "google");
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "OAuth failed");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReset) return;
    setLoading(true);
    try {
      await authApi.resetPassword(resetCode.trim(), newPassword);
      toast.success("Password reset! Sign in with your new password.");
      window.location.href = "/login";
    } catch (err: any) {
      toast.error(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold tracking-tight">
            <span className="text-accent">do.</span> Forgot Password
          </CardTitle>
          <CardDescription>
            {step === "username" && "Enter your username to look up your account"}
            {step === "action" && "Sign in with your linked provider"}
            {step === "reset" && "Enter the reset code and your new password"}
          </CardDescription>
        </CardHeader>

        {step === "username" && (
          <form onSubmit={handleLookup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Looking up..." : "Look up account"}
              </Button>
              <Link href="/login" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </Link>
            </CardFooter>
          </form>
        )}

        {step === "action" && (
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              This account uses OAuth. Sign in with your provider instead.
            </p>
            <div className="flex flex-col gap-2">
              {oauthProviders.includes("github") && (
                <Button variant="outline" onClick={() => handleOAuth("github")}>
                  <Github className="mr-2 h-4 w-4" /> Sign in with GitHub
                </Button>
              )}
              {oauthProviders.includes("google") && (
                <Button variant="outline" onClick={() => handleOAuth("google")}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </Button>
              )}
            </div>
            <Link href="/login" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3 w-3" /> Back to login
            </Link>
          </CardContent>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              {displayedCode && (
                <div className="rounded-md border bg-muted p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Your reset code:</p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-primary">{displayedCode}</p>
                  <p className="text-xs text-muted-foreground mt-1">Expires in 15 minutes</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Reset Code</Label>
                <Input
                  id="code"
                  placeholder="Enter the code above"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Choose a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <PasswordComplexity password={newPassword} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={!canReset}>
                {loading ? "Resetting..." : "Reset Password"}
                {!loading && <KeyRound className="ml-2 h-4 w-4" />}
              </Button>
              <Link href="/login" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
