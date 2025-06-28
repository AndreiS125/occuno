"use client";

import { 
  Info,
  Target,
  CheckCircle,
  Repeat,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TerminologyGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Info className="w-4 h-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Understanding Objective Types</DialogTitle>
          <DialogDescription>
            Auxilium uses a hierarchical system to organize your goals and tasks
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">ROOT Objective</h4>
              <p className="text-sm text-muted-foreground">
                Major life goals or projects (e.g., &ldquo;Win a science fair&rdquo;, &ldquo;Launch my startup&rdquo;).
                These are your biggest ambitions that will be broken down into smaller pieces.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Target className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">SUB_OBJECTIVE</h4>
              <p className="text-sm text-muted-foreground">
                Milestones or phases within a larger goal (e.g., &ldquo;Research phase&rdquo;, &ldquo;Build prototype&rdquo;).
                These can have their own sub-objectives, creating a tree structure.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">TASK (Calendar Events)</h4>
              <p className="text-sm text-muted-foreground">
                Concrete, schedulable actions with specific start and end times (e.g., &ldquo;Team meeting at 2pm&rdquo;, 
                &ldquo;Code review session&rdquo;). These are what appear on your calendar - think of them as 
                your Google Calendar events.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Repeat className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">HABIT</h4>
              <p className="text-sm text-muted-foreground">
                Recurring activities you want to build into routines (e.g., &ldquo;Exercise 30 mins daily&rdquo;, 
                &ldquo;Review goals every Sunday&rdquo;). These can be scheduled to repeat automatically.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Pro tip:</strong> When creating calendar events, they&rsquo;re automatically created as TASKs. 
            You can optionally link them to a parent objective to keep your schedule organized within 
            your larger goals.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 