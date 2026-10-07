"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "items",
  className,
}: ClientPaginationProps) {
  if (totalItems <= pageSize) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const from = (safeCurrentPage - 1) * pageSize + 1;
  const to = Math.min(safeCurrentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (safeTotalPages <= 5) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("ellipsis");

      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (safeCurrentPage < safeTotalPages - 2) pages.push("ellipsis");
      if (!pages.includes(safeTotalPages)) pages.push(safeTotalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600 select-none",
        className
      )}
    >
      <div className="text-neutral-500 font-mono">
        Showing <span className="font-semibold text-neutral-900">{from}</span>–
        <span className="font-semibold text-neutral-900">{to}</span> of{" "}
        <span className="font-semibold text-neutral-900">{totalItems}</span> {itemLabel}
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          aria-label="First page"
          className="w-8 h-8 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 disabled:bg-neutral-100/70 disabled:border-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          aria-label="Previous page"
          className="w-8 h-8 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 disabled:bg-neutral-100/70 disabled:border-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1 px-1">
          {pages.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-neutral-400 select-none">
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
                  "min-w-8 h-8 px-2 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
                  isActive
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-700 hover:bg-neutral-200/70"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
          aria-label="Next page"
          className="w-8 h-8 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 disabled:bg-neutral-100/70 disabled:border-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage === safeTotalPages}
          aria-label="Last page"
          className="w-8 h-8 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 disabled:bg-neutral-100/70 disabled:border-neutral-200 disabled:text-neutral-300 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
