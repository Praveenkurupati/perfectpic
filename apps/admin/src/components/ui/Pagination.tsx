"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "results",
  className,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const from = (safeCurrentPage - 1) * pageSize + 1;
  const to = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (safeCurrentPage < safeTotalPages - 2) {
        pages.push("ellipsis");
      }
      if (!pages.includes(safeTotalPages)) {
        pages.push(safeTotalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "p-4 border-t border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-noir-600 bg-white select-none",
        className
      )}
    >
      {/* Left: Range and Count */}
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="font-semibold text-noir-900">{from}</strong> to{" "}
          <strong className="font-semibold text-noir-900">{to}</strong> of{" "}
          <strong className="font-semibold text-noir-900">{totalItems.toLocaleString("en-IN")}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-cream-300">
            <span className="text-noir-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Select items per page"
              className="bg-cream-50 border border-cream-300 text-noir-900 rounded-sm px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-noir-400 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center space-x-1.5">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          title="First page"
          aria-label="Go to first page"
          className="w-8 h-8 rounded-sm border border-cream-300 bg-white text-noir-700 hover:bg-cream-100 hover:text-noir-950 disabled:bg-cream-200 disabled:border-cream-300 disabled:text-noir-400 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir-900 focus-visible:ring-offset-1"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          title="Previous page"
          aria-label="Go to previous page"
          className="w-8 h-8 rounded-sm border border-cream-300 bg-white text-noir-700 hover:bg-cream-100 hover:text-noir-950 disabled:bg-cream-200 disabled:border-cream-300 disabled:text-noir-400 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir-900 focus-visible:ring-offset-1"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page pills */}
        <div className="flex items-center space-x-1 px-1">
          {pages.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-noir-500 font-bold select-none">
                  …
                </span>
              );
            }
            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-label={`Go to page ${p}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "min-w-8 h-8 px-2.5 text-xs font-medium rounded-sm transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir-900 focus-visible:ring-offset-1",
                  isActive
                    ? "bg-noir-950 text-cream-50 font-semibold shadow-xs border border-noir-950"
                    : "bg-white text-noir-800 hover:bg-cream-100 hover:text-noir-950 border border-cream-300"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next page button */}
        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
          title="Next page"
          aria-label="Go to next page"
          className="w-8 h-8 rounded-sm border border-cream-300 bg-white text-noir-700 hover:bg-cream-100 hover:text-noir-950 disabled:bg-cream-200 disabled:border-cream-300 disabled:text-noir-400 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir-900 focus-visible:ring-offset-1"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage === safeTotalPages}
          title="Last page"
          aria-label="Go to last page"
          className="w-8 h-8 rounded-sm border border-cream-300 bg-white text-noir-700 hover:bg-cream-100 hover:text-noir-950 disabled:bg-cream-200 disabled:border-cream-300 disabled:text-noir-400 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir-900 focus-visible:ring-offset-1"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
