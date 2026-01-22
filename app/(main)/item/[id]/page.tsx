"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  Clock,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock data - will be replaced with real data from Supabase
const mockItem = {
  id: "1",
  title: "Reply to John about Q4 report",
  description:
    "John is asking for an update on the Q4 financial report and wants to schedule a review meeting.",
  category: "reply",
  priority: "urgent",
  confidence: 0.92,
  senderName: "John Doe",
  senderEmail: "john@company.com",
  emailSubject: "Q4 Report - Need Update ASAP",
  emailSnippet:
    "Hi there, I hope you're doing well. I wanted to follow up on the Q4 financial report we discussed last week. Could you send me the latest version? I'd also like to schedule a review meeting before the end of the week...",
  emailDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  hasAttachment: false,
  status: "active",
};

export default function ItemDetailPage() {
  const params = useParams();
  const itemId = params.id;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Back Button */}
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Item Card */}
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-6">
          <Avatar className="mt-1">
            <AvatarImage src="" />
            <AvatarFallback>
              {mockItem.senderName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {mockItem.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge
                variant={
                  mockItem.priority === "urgent" ? "destructive" : "secondary"
                }
              >
                {mockItem.priority}
              </Badge>
              <Badge variant="outline">{mockItem.category}</Badge>
              <Badge variant="secondary">
                {Math.round(mockItem.confidence * 100)}% confidence
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>From: {mockItem.senderName}</p>
              <p>Email: {mockItem.senderEmail}</p>
              <p>
                Date: {formatDate(mockItem.emailDate)} at{" "}
                {formatTime(mockItem.emailDate)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Description */}
        {mockItem.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-2">
              What needs to be done
            </h3>
            <p className="text-muted-foreground">{mockItem.description}</p>
          </div>
        )}

        {/* Email Preview */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-2">
            Email Preview
          </h3>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-medium mb-2">{mockItem.emailSubject}</p>
            <p className="text-sm text-muted-foreground">
              {mockItem.emailSnippet}
            </p>
          </div>
          <Button variant="link" size="sm" className="mt-2 px-0">
            View full email in Gmail
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>

        <Separator className="my-6" />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button size="lg" className="tap-target">
            <Mail className="w-4 h-4 mr-2" />
            Reply in Gmail
          </Button>
          <Button size="lg" variant="outline" className="tap-target">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Done
          </Button>
          <Button size="lg" variant="outline" className="tap-target">
            <Clock className="w-4 h-4 mr-2" />
            Snooze
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="tap-target text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        <Separator className="my-6" />

        {/* Feedback Section */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">
            Was this extraction helpful?
          </h3>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="tap-target">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes, accurate
            </Button>
            <Button variant="outline" className="tap-target">
              <ThumbsDown className="w-4 h-4 mr-2" />
              No, incorrect
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your feedback helps improve extraction accuracy
          </p>
        </div>
      </Card>
    </div>
  );
}
