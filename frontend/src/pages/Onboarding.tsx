import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const [university, setUniversity] = useState("");
  const [apiToken, setApiToken] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConnect = () => {
    if (!university || !apiToken) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Simulate connection
    toast({
      title: "Connected Successfully",
      description: "Welcome to ASTAR!",
    });
    
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card with glassmorphism effect */}
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">
              Welcome to ASTAR
            </h1>
            <p className="text-muted-foreground">Bring Back Critical Thinking</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Select value={university} onValueChange={setUniversity}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canvas">Canvas.instructure.com</SelectItem>
                  <SelectItem value="custom">Custom Domain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiToken">Canvas API Token</Label>
              <Input
                id="apiToken"
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Enter your API token"
                className="bg-background"
              />
            </div>

            <Button
              onClick={handleConnect}
              className="w-full bg-gradient-primary text-white shadow-glow hover:shadow-lg hover:scale-[1.02] transition-all mt-6 h-12 text-base font-semibold"
            >
              Connect to Canvas
            </Button>
          </div>

          {/* Help text */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Need help finding your API token?{" "}
            <a
              href="#"
              className="text-primary hover:underline"
            >
              View instructions
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
