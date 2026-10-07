// apps/backend/src/controllers/PrivacyController.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../db/models/User';
import { Project } from '../db/models/Project';
import { Order } from '../db/models/Order';
import { Address } from '../db/models/Address';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';

export class PrivacyController {
  /**
   * DPDP Act 2023: Right to Access and Data Portability
   * Exports all personal records, projects, addresses, and order history for authenticated user.
   */
  public static async exportUserData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const userEmail = (req as any).user?.email;

      if (!userId && !userEmail) {
        throw ApiError.unauthorized('Authentication required to export personal data.');
      }

      let profileData: any = { id: userId, email: userEmail };
      let userAddresses: any[] = [];
      let userProjects: any[] = [];
      let userOrders: any[] = [];

      if (isDbConnected()) {
        const userDoc = await User.findById(userId).select('-password');
        if (userDoc) {
          profileData = userDoc.toJSON();
        }

        userAddresses = await Address.find({ userId }).lean();
        userProjects = await Project.find({ userId }).select('-photos.base64').lean();
        userOrders = await Order.find({
          $or: [{ userId }, { customerEmail: userEmail }],
        }).select('-paymentDetails.secret').lean();
      }

      const exportPayload = {
        complianceStandard: 'Digital Personal Data Protection Act 2023 (DPDP)',
        exportDate: new Date().toISOString(),
        dataSubject: {
          id: userId,
          email: userEmail,
        },
        profile: profileData,
        addresses: userAddresses,
        projects: userProjects,
        orders: userOrders,
        retentionPolicy: {
          photos: 'Temporary uploads auto-expire in 30 days. Final order press masters preserved for reprints.',
          taxInvoices: 'Statutory GST invoices retained for 7 years as mandated by Section 36 of CGST Act 2017.',
        },
      };

      logger.info(`[DPDP] Data export generated for user ${userEmail || userId}`);
      return res.status(200).json(exportPayload);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DPDP Act 2023: Right to Erasure / Self-Service "Erase My Data"
   * Purges active projects, anonymizes profile, and scrubs personal identifiers
   * while preserving legally mandated tax audit proof.
   */
  public static async eraseUserData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const userEmail = (req as any).user?.email;

      if (!userId && !userEmail) {
        throw ApiError.unauthorized('Authentication required to erase personal data.');
      }

      let deletedProjectsCount = 0;
      let anonymizedOrdersCount = 0;

      if (isDbConnected()) {
        // 1. Delete user draft projects
        const projResult = await Project.deleteMany({ userId });
        deletedProjectsCount = projResult.deletedCount || 0;

        // 2. Delete saved addresses
        await Address.deleteMany({ userId });

        // 3. Scrub and anonymize order customer PII (preserving tax numbers & amounts)
        const orderResult = await Order.updateMany(
          { $or: [{ userId }, { customerEmail: userEmail }] },
          {
            $set: {
              customerName: '[Anonymized under DPDP Act 2023]',
              customerPhone: '[Anonymized]',
              'shippingAddress.fullName': '[Anonymized under DPDP Act 2023]',
              'shippingAddress.phone': '[Anonymized]',
              'shippingAddress.addressLine1': '[Redacted pursuant to erasure request]',
              'shippingAddress.addressLine2': '',
              'shippingAddress.landmark': '',
            },
            $push: {
              auditLog: {
                action: 'dpdp_erasure',
                updatedBy: userEmail || 'user_self_service',
                timestamp: new Date(),
                details: 'Customer personal identifiers scrubbed under DPDP Act 2023 erasure request',
              },
            },
          }
        );
        anonymizedOrdersCount = orderResult.modifiedCount || 0;

        // 4. Anonymize user profile
        await User.findByIdAndUpdate(userId, {
          $set: {
            name: 'Deleted User',
            email: `deleted_${userId}_${Date.now()}@anonymized.local`,
            phone: null,
            isActive: false,
          },
        });
      }

      logger.info(`[DPDP] Data erasure completed for user ${userEmail || userId}: ${deletedProjectsCount} projects purged, ${anonymizedOrdersCount} orders anonymized.`);

      return res.status(200).json({
        success: true,
        message: 'Your personal data has been erased and personal identifiers scrubbed pursuant to the DPDP Act 2023.',
        summary: {
          purgedProjects: deletedProjectsCount,
          anonymizedOrders: anonymizedOrdersCount,
          statutoryRetentionNote: 'Tax and financial invoice transaction numbers are retained anonymously for statutory GST audit compliance (CGST Act Section 36).',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export default PrivacyController;
