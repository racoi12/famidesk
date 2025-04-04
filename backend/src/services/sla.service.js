const { Incident, User } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('./notification.service');

/**
 * Servicio para gestionar SLAs (Acuerdos de Nivel de Servicio)
 */
class SLAService {
  /**
   * Programar una verificación de SLA para un incidente
   * @param {number} incidentId - ID del incidente
   * @param {Date} dueDate - Fecha límite del SLA
   */
  scheduleSLACheck(incidentId, dueDate) {
    if (!dueDate) return;
    
    const now = new Date();
    const timeUntilDue = dueDate.getTime() - now.getTime();
    
    // Si la fecha ya pasó, verificar inmediatamente
    if (timeUntilDue <= 0) {
      this.checkSLA(incidentId);
      return;
    }
    
    // Programar recordatorio cuando quede el 50% del tiempo
    const halfTimeReminder = Math.floor(timeUntilDue / 2);
    if (halfTimeReminder > 0) {
      setTimeout(() => {
        this.sendSLAReminder(incidentId, 50);
      }, halfTimeReminder);
    }
    
    // Programar recordatorio cuando quede el 25% del tiempo
    const quarterTimeReminder = Math.floor(timeUntilDue * 0.75);
    if (quarterTimeReminder > 0) {
      setTimeout(() => {
        this.sendSLAReminder(incidentId, 25);
      }, quarterTimeReminder);
    }
    
    // Programar verificación final cuando se cumpla el plazo
    setTimeout(() => {
      this.checkSLA(incidentId);
    }, timeUntilDue);
    
    console.log(`[SLA] Programada verificación para incidente ${incidentId} en ${new Date(now.getTime() + timeUntilDue)}`);
  }
  
  /**
   * Enviar recordatorio de SLA
   * @param {number} incidentId - ID del incidente
   * @param {number} percentRemaining - Porcentaje de tiempo restante
   */
  async sendSLAReminder(incidentId, percentRemaining) {
    try {
      const incident = await Incident.findByPk(incidentId, {
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'username', 'fullName'] }
        ]
      });
      
      if (!incident) {
        console.error(`[SLA] Incidente ${incidentId} no encontrado para recordatorio`);
        return;
      }
      
      // Si el incidente ya está resuelto o cerrado, no enviar recordatorio
      if (['resolved', 'closed'].includes(incident.status)) {
        return;
      }
      
      // Si no hay asignado, no podemos enviar recordatorio
      if (!incident.assignedToId) {
        return;
      }
      
      // Enviar recordatorio al asignado
      await notificationService.createNotification({
        type: 'due_date',
        message: `Recordatorio: Queda un ${percentRemaining}% del tiempo para resolver el incidente "${incident.title}"`,
        recipientId: incident.assignedToId,
        entityType: 'incident',
        entityId: incident.id,
        data: {
          incidentId: incident.id,
          incidentTitle: incident.title,
          dueDate: incident.dueDate,
          percentRemaining
        }
      });
      
      console.log(`[SLA] Enviado recordatorio ${percentRemaining}% para incidente ${incidentId} a usuario ${incident.assignedToId}`);
    } catch (error) {
      console.error(`[SLA] Error al enviar recordatorio para incidente ${incidentId}:`, error);
    }
  }
  
  /**
   * Verificar si un incidente ha excedido su SLA
   * @param {number} incidentId - ID del incidente
   */
  async checkSLA(incidentId) {
    try {
      const incident = await Incident.findByPk(incidentId, {
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'username', 'fullName'] },
          { model: User, as: 'creator', attributes: ['id', 'username', 'fullName'] }
        ]
      });
      
      if (!incident) {
        console.error(`[SLA] Incidente ${incidentId} no encontrado para verificación`);
        return;
      }
      
      // Si el incidente ya está resuelto o cerrado, no hacer nada
      if (['resolved', 'closed'].includes(incident.status)) {
        return;
      }
      
      const now = new Date();
      
      // Verificar si se ha excedido el SLA
      if (incident.dueDate && now > incident.dueDate) {
        console.log(`[SLA] El incidente ${incidentId} ha excedido su SLA, escalando...`);
        
        // Si no hay un coordinador asignado para escalar, notificar al admin
        const escalateToId = incident.assignedToId ? 
          // Buscar coordinador o admin para escalar
          (await this.findEscalationTarget(incident.assignedToId)) : 
          // Buscar cualquier admin si no hay asignado
          (await this.findAnyAdmin());
        
        if (escalateToId) {
          // Actualizar el incidente para marcarlo como escalado
          incident.isEscalated = true;
          incident.escalatedToId = escalateToId;
          incident.escalatedAt = now;
          incident.status = 'escalated';
          await incident.save();
          
          // Notificar al coordinador/admin sobre el escalamiento
          await notificationService.createNotification({
            type: 'escalation',
            message: `El incidente "${incident.title}" ha sido escalado automáticamente por exceder el SLA`,
            recipientId: escalateToId,
            entityType: 'incident',
            entityId: incident.id,
            data: {
              incidentId: incident.id,
              incidentTitle: incident.title,
              dueDate: incident.dueDate,
              reason: 'SLA excedido'
            }
          });
          
          // Notificar al asignado original
          if (incident.assignedToId) {
            await notificationService.createNotification({
              type: 'escalation',
              message: `El incidente "${incident.title}" ha sido escalado automáticamente por exceder el SLA`,
              recipientId: incident.assignedToId,
              entityType: 'incident',
              entityId: incident.id,
              data: {
                incidentId: incident.id,
                incidentTitle: incident.title,
                dueDate: incident.dueDate,
                escalatedToId,
                reason: 'SLA excedido'
              }
            });
          }
          
          // Notificar al creador
          await notificationService.createNotification({
            type: 'escalation',
            message: `El incidente "${incident.title}" ha sido escalado automáticamente por exceder el SLA`,
            recipientId: incident.createdById,
            entityType: 'incident',
            entityId: incident.id,
            data: {
              incidentId: incident.id,
              incidentTitle: incident.title,
              dueDate: incident.dueDate,
              escalatedToId,
              reason: 'SLA excedido'
            }
          });
        } else {
          console.error(`[SLA] No se encontró ningún coordinador o admin para escalar el incidente ${incidentId}`);
        }
      }
    } catch (error) {
      console.error(`[SLA] Error al verificar SLA para incidente ${incidentId}:`, error);
    }
  }
  
  /**
   * Buscar un usuario para escalar (coordinador o admin)
   * @param {number} currentAssigneeId - ID del asignado actual
   * @returns {Promise<number|null>} ID del usuario para escalar o null si no se encuentra
   */
  async findEscalationTarget(currentAssigneeId) {
    try {
      // Buscar un coordinador o admin que no sea el asignado actual
      const escalationTarget = await User.findOne({
        where: {
          id: { [Op.ne]: currentAssigneeId },
          role: { [Op.in]: ['coordinador', 'admin'] },
          isActive: true
        },
        order: [['lastLogin', 'DESC']] // Priorizar a los más activos recientemente
      });
      
      return escalationTarget ? escalationTarget.id : null;
    } catch (error) {
      console.error('Error al buscar destino para escalamiento:', error);
      return null;
    }
  }
  
  /**
   * Buscar cualquier admin para escalar
   * @returns {Promise<number|null>} ID del admin o null si no se encuentra
   */
  async findAnyAdmin() {
    try {
      const admin = await User.findOne({
        where: {
          role: 'admin',
          isActive: true
        },
        order: [['lastLogin', 'DESC']]
      });
      
      return admin ? admin.id : null;
    } catch (error) {
      console.error('Error al buscar admin:', error);
      return null;
    }
  }
  
  /**
   * Verificar todos los incidentes pendientes para SLA
   * Útil para ejecutar como un cron job periódicamente
   */
  async checkAllPendingSLAs() {
    try {
      const now = new Date();
      
      // Buscar todos los incidentes pendientes que están por vencer
      const pendingIncidents = await Incident.findAll({
        where: {
          status: { [Op.notIn]: ['resolved', 'closed'] },
          dueDate: { [Op.lte]: now }
        }
      });
      
      console.log(`[SLA] Verificando ${pendingIncidents.length} incidentes pendientes`);
      
      // Verificar cada incidente
      for (const incident of pendingIncidents) {
        await this.checkSLA(incident.id);
      }
      
      return pendingIncidents.length;
    } catch (error) {
      console.error('Error al verificar SLAs pendientes:', error);
      throw error;
    }
  }
}

module.exports = new SLAService();
