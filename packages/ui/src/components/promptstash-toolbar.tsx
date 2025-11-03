"use client";

import * as React from "react";
import {
  FilePlus,
  FolderPlus,
  Upload,
  Download,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Share2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "./button";
import { Separator } from "./separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export interface PromptStashToolbarProps {
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onUpload?: () => void;
  onDownload?: () => void;
  onSort?: () => void;
  onFilter?: () => void;
  onSelectMultiple?: () => void;
  onShare?: () => void;
  onMore?: () => void;
}

export function PromptStashToolbar({
  onNewFile,
  onNewFolder,
  onUpload,
  onDownload,
  onSort,
  onFilter,
  onSelectMultiple,
  onShare,
  onMore,
}: PromptStashToolbarProps) {
  return (
    <div className="flex h-12 items-center justify-center gap-1 border-b bg-background px-5">
      <TooltipProvider delayDuration={300}>
        {/* New File - Primary Action */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              onClick={onNewFile}
              className="h-9 w-9 bg-gradient-to-br from-[#03A9F4] to-[#0288D1] hover:from-[#03A9F4] hover:to-[#0288D1] hover:opacity-90 hover:-translate-y-px shadow-[0_1px_3px_rgba(3,169,244,0.3)] hover:shadow-[0_2px_5px_rgba(3,169,244,0.4)] transition-all text-white"
            >
              <FilePlus className="h-4 w-4" />
              <span className="sr-only">New File</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New File</p>
          </TooltipContent>
        </Tooltip>

        {/* New Folder */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewFolder}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <FolderPlus className="h-4 w-4" />
              <span className="sr-only">New Folder</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New Folder</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-2 h-5" />

        {/* Upload */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUpload}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Upload</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload</p>
          </TooltipContent>
        </Tooltip>

        {/* Download */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-2 h-5" />

        {/* Sort */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSort}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="sr-only">Sort</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sort</p>
          </TooltipContent>
        </Tooltip>

        {/* Filter */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFilter}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Filter</p>
          </TooltipContent>
        </Tooltip>

        {/* Select Multiple */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSelectMultiple}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="sr-only">Select Multiple</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select Multiple</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-2 h-5" />

        {/* Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share</p>
          </TooltipContent>
        </Tooltip>

        {/* More Options */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMore}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More Options</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>More Options</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
