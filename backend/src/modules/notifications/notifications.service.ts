import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification for a user.
   */
  async create(data: {
    userId: string;
    organizationId: string;
    title: string;
    message: string;
    type?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        isRead: false,
      },
    });

    this.logger.log(
      `Notification created: ${notification.id} (user: ${data.userId})`,
    );
    return notification;
  }

  /**
   * List notifications for a user (scoped to organization).
   */
  async findAll(userId: string, organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId, organizationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({
        where: { userId, organizationId },
      }),
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount: await this.prisma.notification.count({
        where: { userId, organizationId, isRead: false },
      }),
    };
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: string, userId: string, organizationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.organizationId !== organizationId) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return updated;
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string, organizationId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, organizationId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Delete a notification.
   */
  async remove(id: string, userId: string, organizationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.organizationId !== organizationId) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted successfully' };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string, organizationId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, organizationId, isRead: false },
    });
    return { unreadCount: count };
  }
}
