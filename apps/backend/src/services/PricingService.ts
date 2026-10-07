// apps/backend/src/services/PricingService.ts
import { ProductRepository } from '../repositories/ProductRepository';
import { BundleService } from './BundleService';
import { PromoCodeService } from './PromoCodeService';
import { pageCountOptions, coverTypes, packagingOptions } from '../data/templates';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export interface CartItemInput {
  id?: string;
  projectId?: string;
  templateId?: string;
  templateSlug?: string;
  slug?: string;
  title?: string;
  size?: string;
  dimensions?: string;
  pageCount?: number;
  coverType?: string;
  cover?: string;
  packaging?: string;
  theme?: string;
  color?: string;
  quantity?: number;
  price?: number;
  basePrice?: number;
  extraPagesPrice?: number;
  thumbnail?: string;
  projectSnapshot?: any;
}

export interface AccessoriesInput {
  keepsakeBox?: boolean;
  giftWrap?: boolean;
  uvGlaze?: boolean;
  miniPolaroids?: boolean;
  total?: number;
  items?: Array<{ id: string; title: string; price: number }>;
}

export interface PricingCalculationInput {
  items?: CartItemInput[];
  accessories?: AccessoriesInput | null;
  packaging?: AccessoriesInput | null;
  promoCode?: string | null;
  deliveryOption?: 'standard' | 'express' | string;
  customerEmail?: string;
  customerPhone?: string;
  userId?: string;
  claimedTotal?: number;
  claimedAmount?: number;
}

export interface CalculatedItem {
  id?: string;
  projectId?: string;
  title: string;
  templateId?: string;
  templateSlug?: string;
  size: string;
  dimensions: string;
  pageCount: number;
  coverType: string;
  unitBasePrice: number;
  coverAdjustment: number;
  pageAdjustment: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  thumbnail?: string;
}

export interface AuthoritativePricingResult {
  items: CalculatedItem[];
  itemsSubtotal: number;
  accessories: {
    keepsakeBox: boolean;
    giftWrap: boolean;
    uvGlaze: boolean;
    miniPolaroids: boolean;
    total: number;
    items: Array<{ id: string; title: string; price: number }>;
  };
  accessoriesSubtotal: number;
  subtotal: number;
  totalBooks: number;
  bundleDiscount: number;
  bundleTier: string | null;
  bundleFreeShipping: boolean;
  promoDiscount: number;
  promoCode: string | null;
  promoDetails: any | null;
  totalDiscount: number;
  deliveryOption: 'standard' | 'express';
  shippingFee: number;
  finalTotal: number;
  amount: number; // In paise for payment gateway
  currency: 'INR';
  isFreeShipping: boolean;
}

export const ACCESSORY_CATALOG = {
  keepsakeBox: {
    id: 'acc-keepsake-box',
    title: 'Keepsake Velvet Presentation Box',
    price: 499,
  },
  giftWrap: {
    id: 'acc-gift-wrap',
    title: 'Artisan Ribbon Wrap & Calligraphy Card',
    price: 199,
  },
  uvGlaze: {
    id: 'acc-uv-glaze',
    title: 'Archival UV Anti-Scratch Page Glaze',
    price: 249,
  },
  miniPolaroids: {
    id: 'acc-mini-prints',
    title: '10 Mini Polaroid Keepsake Prints',
    price: 149,
  },
} as const;

export class PricingService {
  /**
   * Determine authoritative base price for a given template and size
   */
  public static async resolveBasePrice(item: CartItemInput): Promise<{
    basePrice: number;
    normalizedSize: string;
    resolvedTitle: string;
    templateId?: string;
    templateSlug?: string;
  }> {
    const slugOrId =
      item.templateSlug ||
      item.slug ||
      item.templateId ||
      item.projectSnapshot?.template?.slug ||
      item.projectSnapshot?.template?.id ||
      '';

    let product: any = null;
    if (slugOrId) {
      product = await ProductRepository.findBySlugOrId(String(slugOrId));
    }

    // Normalize size
    const rawDimensions = String(
      item.dimensions ||
      item.size ||
      item.projectSnapshot?.bookConfig?.size ||
      ''
    ).toLowerCase();

    const isLarge = rawDimensions.includes('10');
    const normalizedSize = isLarge ? '10x10' : '8.25x8.25';

    let basePrice = isLarge ? 2499 : 1999;
    if (product && product.pricing) {
      if (isLarge && product.pricing['10']) {
        basePrice = Number(product.pricing['10']);
      } else if (!isLarge && product.pricing['8.25']) {
        basePrice = Number(product.pricing['8.25']);
      } else if (product.fromPrice && !isLarge) {
        basePrice = Number(product.fromPrice);
      }
    }

    const resolvedTitle =
      item.title ||
      product?.displayName ||
      product?.title ||
      'Custom Photobook Keepsake';

    return {
      basePrice,
      normalizedSize,
      resolvedTitle,
      templateId: product?.id || item.templateId,
      templateSlug: product?.slug || item.templateSlug,
    };
  }

  /**
   * Resolve cover type price adjustment (+500 for leather, -300 for softcover, 0 for laminar)
   */
  public static resolveCoverAdjustment(item: CartItemInput): {
    coverType: string;
    coverAdjustment: number;
  } {
    const rawCover = String(
      item.coverType ||
      item.cover ||
      item.projectSnapshot?.bookConfig?.coverType ||
      item.projectSnapshot?.bookConfig?.cover ||
      ''
    ).toLowerCase();

    if (rawCover.includes('leather') || rawCover.includes('cov-2')) {
      return { coverType: 'Hardcover Vegan Leather', coverAdjustment: 500 };
    }
    if (rawCover.includes('soft') || rawCover.includes('cov-3')) {
      return { coverType: 'Softcover Artisan', coverAdjustment: -300 };
    }
    return { coverType: 'Hardcover Laminar', coverAdjustment: 0 };
  }

  /**
   * Resolve page count adjustment against standard page count tiers
   */
  public static resolvePageAdjustment(pageCount: number): number {
    const matchedOption = pageCountOptions.find((p) => p.count === pageCount);
    if (matchedOption) {
      return matchedOption.priceAdjustment;
    }

    // Custom or dynamic page count: standard baseline is 32 pages
    const basePageCount = 32;
    const diff = pageCount - basePageCount;
    if (diff === 0) return 0;
    // ₹25 per extra page (₹50 per two-page spread)
    return diff * 25;
  }

  /**
   * Full authoritative calculation for cart or order
   */
  public static async calculateOrderPrice(
    input: PricingCalculationInput
  ): Promise<AuthoritativePricingResult> {
    const rawItems = Array.isArray(input.items) ? input.items : [];
    const calculatedItems: CalculatedItem[] = [];
    let itemsSubtotal = 0;
    let totalBooks = 0;

    for (const item of rawItems) {
      const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
      const pageCount = Number(
        item.pageCount ||
        item.projectSnapshot?.bookConfig?.pages ||
        32
      );

      const { basePrice, normalizedSize, resolvedTitle, templateId, templateSlug } =
        await this.resolveBasePrice(item);
      const { coverType, coverAdjustment } = this.resolveCoverAdjustment(item);
      const pageAdjustment = this.resolvePageAdjustment(pageCount);

      const unitPrice = Math.max(99, basePrice + coverAdjustment + pageAdjustment);
      const itemSubtotal = unitPrice * quantity;

      itemsSubtotal += itemSubtotal;
      totalBooks += quantity;

      calculatedItems.push({
        id: item.id,
        projectId: item.projectId,
        title: resolvedTitle,
        templateId,
        templateSlug,
        size: normalizedSize,
        dimensions: normalizedSize === '10x10' ? '10" × 10"' : '8.25" × 8.25"',
        pageCount,
        coverType,
        unitBasePrice: basePrice,
        coverAdjustment,
        pageAdjustment,
        unitPrice,
        quantity,
        subtotal: itemSubtotal,
        thumbnail: item.thumbnail,
      });
    }

    // 2. Authoritative Accessories and Packaging Calculation
    const accInput = input.accessories || input.packaging || {};
    const selectedAccessories: Array<{ id: string; title: string; price: number }> = [];
    let accessoriesSubtotal = 0;

    const hasKeepsakeBox = Boolean(accInput.keepsakeBox);
    const hasGiftWrap = Boolean(accInput.giftWrap);
    const hasUvGlaze = Boolean(accInput.uvGlaze);
    const hasMiniPolaroids = Boolean(accInput.miniPolaroids);

    if (hasKeepsakeBox) {
      selectedAccessories.push(ACCESSORY_CATALOG.keepsakeBox);
      accessoriesSubtotal += ACCESSORY_CATALOG.keepsakeBox.price;
    }
    if (hasGiftWrap) {
      selectedAccessories.push(ACCESSORY_CATALOG.giftWrap);
      accessoriesSubtotal += ACCESSORY_CATALOG.giftWrap.price;
    }
    if (hasUvGlaze) {
      selectedAccessories.push(ACCESSORY_CATALOG.uvGlaze);
      accessoriesSubtotal += ACCESSORY_CATALOG.uvGlaze.price;
    }
    if (hasMiniPolaroids) {
      selectedAccessories.push(ACCESSORY_CATALOG.miniPolaroids);
      accessoriesSubtotal += ACCESSORY_CATALOG.miniPolaroids.price;
    }

    const accessoriesResult = {
      keepsakeBox: hasKeepsakeBox,
      giftWrap: hasGiftWrap,
      uvGlaze: hasUvGlaze,
      miniPolaroids: hasMiniPolaroids,
      total: accessoriesSubtotal,
      items: selectedAccessories,
    };

    // Gross subtotal
    const subtotal = itemsSubtotal + accessoriesSubtotal;

    // 3. Volume Savings (Bundle Tier Discounts)
    const bundleResult = await BundleService.calculateBundleDiscount(totalBooks);
    const bundleDiscount = Math.min(subtotal, bundleResult.discountAmount || 0);
    const bundleTier = bundleResult.qualifyingTier?.name || null;
    const bundleFreeShipping = bundleResult.freeShipping !== false && bundleDiscount > 0;

    // 4. Promo Code Validation & Discount
    let promoDiscount = 0;
    let promoDetails: any = null;
    const rawPromoCode = (input.promoCode || '').trim();

    if (rawPromoCode) {
      try {
        const validated = await PromoCodeService.validatePromo({
          code: rawPromoCode,
          subtotal,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          userId: input.userId,
        });

        if (validated && validated.valid) {
          promoDiscount = Math.min(
            Math.max(0, subtotal - bundleDiscount),
            Number(validated.discountAmount) || 0
          );
          promoDetails = validated;
        }
      } catch (err: any) {
        logger.warn(`[PricingService] Promo code '${rawPromoCode}' rejected: ${err.message}`);
        // If an explicit coupon was supplied that failed validation, throw error so user is notified
        throw ApiError.badRequest(err.message || `Invalid coupon code '${rawPromoCode}'.`);
      }
    }

    const totalDiscount = bundleDiscount + promoDiscount;

    // 5. Shipping Fee Calculation
    const deliveryOption = input.deliveryOption === 'express' ? 'express' : 'standard';
    let shippingFee = 0;
    let isFreeShipping = false;

    if (deliveryOption === 'express') {
      shippingFee = 299;
      isFreeShipping = false;
    } else {
      // Standard pan-India delivery is free on all orders or qualifying bundles
      shippingFee = 0;
      isFreeShipping = true;
    }

    // 6. Final Authoritative Total
    const finalTotal = Math.max(0, Math.round(subtotal - totalDiscount + shippingFee));
    const amountInPaise = Math.round(finalTotal * 100);

    const result: AuthoritativePricingResult = {
      items: calculatedItems,
      itemsSubtotal,
      accessories: accessoriesResult,
      accessoriesSubtotal,
      subtotal,
      totalBooks,
      bundleDiscount,
      bundleTier,
      bundleFreeShipping,
      promoDiscount,
      promoCode: promoDiscount > 0 ? rawPromoCode : null,
      promoDetails,
      totalDiscount,
      deliveryOption,
      shippingFee,
      finalTotal,
      amount: amountInPaise,
      currency: 'INR',
      isFreeShipping,
    };

    // 7. Security Guard: Detect and reject client price tampering
    const claimed = input.claimedTotal !== undefined ? input.claimedTotal : input.claimedAmount;
    if (claimed !== undefined && !isNaN(Number(claimed))) {
      const claimedVal = Number(claimed);
      if (Math.abs(claimedVal - finalTotal) > 1) {
        logger.warn(
          `[Security Guard] Price tampering detected: claimed ₹${claimedVal} vs authoritative ₹${finalTotal}`
        );
        throw ApiError.badRequest(
          `Price mismatch detected: claimed amount ₹${claimedVal} does not match authoritative server price ₹${finalTotal}. Cart recalculated.`
        );
      }
    }

    return result;
  }
}
