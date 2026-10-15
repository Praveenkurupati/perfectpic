"use client";

import React, { useEffect } from "react";

export type ModalType = "remove-book" | "unsaved-changes" | "delete-project" | "custom";

export interface ConfirmationModalProps {
  isOpen: boolean;
  type?: ModalType;
  title?: string;
  description?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  onDiscard?: () => void;
  confirmText?: string;
  cancelText?: string;
  discardText?: string;
  isConfirmLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  type = "remove-book",
  title,
  description,
  onCancel,
  onConfirm,
  onDiscard,
  confirmText,
  cancelText,
  discardText,
  isConfirmLoading = false,
}: ConfirmationModalProps) {
  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Defaults based on modal type from design spec
  let displayTitle = title;
  let displayDesc = description;
  let defaultConfirm = confirmText;
  let defaultCancel = cancelText || "cancel";
  let defaultDiscard = discardText || "discard";

  if (type === "remove-book") {
    displayTitle = displayTitle || "remove this book?";
    displayDesc =
      displayDesc ||
      "it will be removed from your cart. your project stays saved in my projects.";
    defaultConfirm = defaultConfirm || "remove";
  } else if (type === "unsaved-changes") {
    displayTitle = displayTitle || "you have unsaved changes.";
    displayDesc = displayDesc || "leave now and your latest edits will be lost.";
    defaultConfirm = defaultConfirm || "save & exit";
    defaultDiscard = defaultDiscard || "discard";
  } else if (type === "delete-project") {
    displayTitle = displayTitle || "delete this project?";
    displayDesc =
      displayDesc ||
      "this can’t be undone. your uploaded photos will be deleted too.";
    defaultConfirm = defaultConfirm || "delete project";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl p-7 md:p-8 max-w-sm w-full shadow-2xl border border-[#D9D6CF]/70 text-left relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#0A0A0A] lowercase mb-2">
          {displayTitle}
        </h3>
        <p className="text-xs md:text-sm text-[#706E69] leading-relaxed mb-6 font-normal">
          {displayDesc}
        </p>

        <div className="flex flex-col gap-2.5">
          {type === "unsaved-changes" ? (
            <>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full py-3.5 px-5 rounded-full border border-[#D9D6CF] text-[#0A0A0A] font-medium text-xs md:text-sm hover:bg-[#FAF9F6] transition-colors lowercase"
                >
                  keep editing
                </button>
              )}
              {onDiscard && (
                <button
                  type="button"
                  onClick={onDiscard}
                  className="w-full py-3.5 px-5 rounded-full border border-[#D9D6CF] text-[#0A0A0A] font-medium text-xs md:text-sm hover:bg-[#FAF9F6] transition-colors lowercase"
                >
                  {defaultDiscard}
                </button>
              )}
              {onConfirm && (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isConfirmLoading}
                  className="w-full py-3.5 px-5 rounded-full bg-[#0A0A0A] hover:bg-black text-white font-medium text-xs md:text-sm transition-colors lowercase disabled:opacity-50"
                >
                  {isConfirmLoading ? "saving..." : defaultConfirm}
                </button>
              )}
            </>
          ) : (
            <>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full py-3.5 px-5 rounded-full border border-[#D9D6CF] text-[#0A0A0A] font-medium text-xs md:text-sm hover:bg-[#FAF9F6] transition-colors lowercase"
                >
                  {defaultCancel}
                </button>
              )}
              {onConfirm && (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isConfirmLoading}
                  className="w-full py-3.5 px-5 rounded-full bg-[#0A0A0A] hover:bg-black text-white font-medium text-xs md:text-sm transition-colors lowercase disabled:opacity-50"
                >
                  {isConfirmLoading ? "processing..." : defaultConfirm}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
