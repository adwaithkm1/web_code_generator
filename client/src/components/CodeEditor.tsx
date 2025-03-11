import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Search, Share2 } from "lucide-react";
import { SUPPORTED_LANGUAGES, CATEGORIES } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Group languages by category
const languageGroups = {
  "Programming Languages": [
    "assembly", "c", "cpp", "csharp", "java", "python", "javascript", "typescript",
    "swift", "kotlin", "rust", "go", "php", "ruby", "dart", "r", "scala", "perl",
    "lua", "haskell"
  ],
  "Web Development": [
    "html", "css", "react", "angular", "vue", "svelte", "nextjs", "nuxtjs",
    "tailwindcss"
  ],
  "Backend & Databases": [
    "nodejs", "django", "flask", "express", "springboot", "aspnet", "laravel",
    "graphql", "rest", "mysql"
  ],
  "Security & Hacking": [
    "hashing", "encryption", "steganography", "keylogger", "reverseshell",
    "sqlinjection", "xss", "csrf", "bufferoverflow", "zeroday"
  ],
  "System Programming": [
    "kernel", "bios", "driver", "memory", "shellcode", "bootloader", "firmware"
  ],
  "AI & Machine Learning": [
    "tensorflow", "pytorch", "neuralnetwork", "deeplearning", "nlp",
    "reinforcementlearning"
  ],
  "Shell Scripting": ["powershell", "bash", "batch"],
  "DevOps & Cloud": ["docker", "kubernetes", "microservices"],
  "Blockchain & Web3": ["blockchain", "smartcontract"],
  "Other": ["quantum"]
};

export function CodeEditor() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [category, setCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { mutate: generateCode, data, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/generate", {
        prompt,
        language,
        category,
      });
      return res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Code generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: shareCode, isPending: isSharing } = useMutation({
    mutationFn: async () => {
      if (!data?.code) return;
      const res = await apiRequest("POST", "/api/share", {
        language,
        prompt,
        code: data.code,
        isPublic: true,
      });
      return res.json();
    },
    onSuccess: (sharedCode) => {
      const url = `${window.location.origin}/share/${sharedCode.shareId}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url);
      toast({
        title: "Code shared successfully",
        description: "Link copied to clipboard",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to share code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = () => {
    if (data?.code) {
      navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter languages based on search query
  const filteredLanguages = searchQuery
    ? Object.entries(languageGroups).reduce((acc, [category, langs]) => {
        const filtered = langs.filter(lang =>
          lang.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, string[]>)
    : languageGroups;

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto p-4">
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Generate Code</h2>
          <Textarea
            placeholder="Describe what you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(filteredLanguages).map(([category, languages]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => generateCode()}
          disabled={!prompt || isPending}
          className="w-full"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Generate Code
        </Button>
      </Card>

      {data?.code && (
        <Card className="p-4 relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Generated Code</h3>
            <div className="absolute top-4 right-4 flex gap-2">
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareCode()}
                  disabled={isSharing}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            <code>{data.code}</code>
          </pre>
          {shareUrl && (
            <div className="mt-4 p-2 bg-muted rounded-md flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast({
                    title: "Link copied",
                    description: "Share link copied to clipboard",
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}