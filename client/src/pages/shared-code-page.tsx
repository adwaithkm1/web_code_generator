import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SharedCode } from "@shared/schema";

export default function SharedCodePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { toast } = useToast();

  const { data: sharedCode, isLoading, error } = useQuery<SharedCode>({
    queryKey: [`/api/share/${shareId}`],
    enabled: !!shareId,
  });

  const copyToClipboard = () => {
    if (sharedCode?.code) {
      navigator.clipboard.writeText(sharedCode.code);
      toast({
        title: "Code copied",
        description: "Code has been copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !sharedCode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Code not found
          </h1>
          <p className="text-muted-foreground">
            This shared code may have expired or been removed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Shared Code</h1>
            <p className="text-muted-foreground mb-1">
              Language: {sharedCode.language}
            </p>
            <p className="text-muted-foreground">
              Prompt: {sharedCode.prompt}
            </p>
          </div>
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
        </div>

        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
          <code>{sharedCode.code}</code>
        </pre>
      </Card>
    </div>
  );
}