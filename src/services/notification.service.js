const { Notification, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Servicio para gestionar notificaciones
 */
class NotificationService {
  /**
   * Crear una nueva notificación
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Object>} Notificación creada
   */
  async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      
      // Aquí se podría implementar el envío de correo electrónico
      // si la notificación debe enviarse por correo
      if (process.env.NODE_ENV !== 'test') {
        this.sendEmailNotification(notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw error;
    }
  }
  
  /**
   * Marcar una notificación como leída
   * @param {number} notificationId - ID de la notificación
   * @param {number} userId - ID del usuario
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      
      if (!notification) {
        throw new Error('Notificación no encontrada');
      }
      
      // Verificar que la notificación pertenece al usuario
      if (notification.recipientId !== userId) {
        throw new Error('No tienes permiso para esta operación');
      }
      
      notification.isRead = true;
      await notification.save();
      
      return true;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }
  
  /**
   * Obtener notificaciones de un usuario
   * @param {number} userId - ID del usuario
   * @param {boolean} unreadOnly - Obtener solo notificaciones no leídas
   * @returns {Promise<Array>} Lista de notificaciones
   */
  async getUserNotifications(userId, unreadOnly = false) {
    try {
      const whereClause = {
        recipientId: userId
      };
      
      if (unreadOnly) {
        whereClause.isRead = false;
      }
      
      const notifications = await Notification.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });
      
      return notifications;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }
  
  /**
   * Enviar notificación por correo electrónico
   * Esta función es un placeholder para la implementación real
   * @param {Object} notification - Notificación a enviar
   */
  async sendEmailNotification(notification) {
    try {
      // Este es un placeholder - aquí se implementaría el envío real de correo
      console.log(`[EMAIL] Enviando notificación ${notification.id} a usuario ${notification.recipientId}`);
      
      // Buscar el usuario para obtener su correo
      const user = await User.findByPk(notification.recipientId);
      
      if (!user || !user.email) {
        console.error(`No se pudo enviar correo: usuario ${notification.recipientId} no encontrado o sin email`);
        return false;
      }
      
      // Aquí iría la implementación real con alguna librería como nodemailer
      console.log(`[EMAIL] Enviando a ${user.email}: ${notification.message}`);
      
      // Marcar la notificación como enviada por correo
      notification.isEmailSent = true;
      await notification.save();
      
      return true;
    } catch (error) {
      console.error('Error al enviar notificación por correo:', error);
      return false;
    }
  }
  
  /**
   * Eliminar notificaciones antiguas
   * @param {number} daysOld - Días de antigüedad para eliminar
   * @returns {Promise<number>} Número de notificaciones eliminadas
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await Notification.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          },
          isRead: true
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error al limpiar notificaciones antiguas:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
