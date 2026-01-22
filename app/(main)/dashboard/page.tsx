"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  CheckCircle,
  Clock,
  Receipt,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

// Mock data - will be replaced with real data from Supabase
const mockItems = [
  {
    id: "1",
    title: "Reply to John about Q4 report",
    category: "reply",
    priority: "urgent",
    senderName: "John Doe",
    senderEmail: "john@company.com",
    emailDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    confidence: 0.92,
  },
  {
    id: "2",
    title: "Review invoice from AWS",
    category: "invoice",
    priority: "normal",
    senderName: "AWS",
    senderEmail: "billing@aws.com",
    emailDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    confidence: 0.95,
    receiptDetails: { vendor: "AWS", amount: 250.0, currency: "USD" },
    receiptCategory: "software",
  },
  {
    id: "3",
    title: "Schedule meeting with Sarah for Q1 planning",
    category: "meeting",
    priority: "normal",
    senderName: "Sarah Smith",
    senderEmail: "sarah@company.com",
    emailDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.88,
  },
];

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {mockItems.length} items need your attention
          </p>
        </div>

        <Button variant="outline" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {mockItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start space-x-4">
                {/* Sender Avatar */}
                <Avatar className="mt-1">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {item.senderName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{item.senderName}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.emailDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge
                      variant={
                        item.priority === "urgent" ? "destructive" : "secondary"
                      }
                    >
                      {item.priority}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                    {item.receiptCategory && (
                      <Badge variant="secondary">{item.receiptCategory}</Badge>
                    )}
                  </div>

                  {/* Receipt Details (if applicable) */}
                  {item.receiptDetails && (
                    <div className="text-sm text-muted-foreground mb-3">
                      {item.receiptDetails.vendor} •{" "}
                      {item.receiptDetails.currency}{" "}
                      {item.receiptDetails.amount}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {item.category === "reply" && (
                      <Button size="sm" variant="default">
                        <Mail className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    )}
                    {item.category === "invoice" && (
                      <Button size="sm" variant="default">
                        <Receipt className="w-4 h-4 mr-1" />
                        View Receipt
                      </Button>
                    )}
                    {item.category === "meeting" && (
                      <Button size="sm" variant="default">
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Clock className="w-4 h-4 mr-1" />
                      Snooze
                    </Button>
                  </div>

                  {/* Feedback */}
                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground mr-2">
                      Was this helpful?
                    </span>
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tasks">
          <p className="text-center text-muted-foreground py-8">
            Filter: Tasks only
          </p>
        </TabsContent>

        <TabsContent value="receipts">
          <p className="text-center text-muted-foreground py-8">
            Filter: Receipts only
          </p>
        </TabsContent>

        <TabsContent value="meetings">
          <p className="text-center text-muted-foreground py-8">
            Filter: Meetings only
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
