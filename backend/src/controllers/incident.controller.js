const { Incident, User, Comment, Attachment } = require('../models');
const notificationService = require('../services/notification.service');
const slaService = require('../services/sla.service');

// Obtener todos los incidentes (con filtros opcionales)
exports.getAllIncidents = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      type, 
      assignedToId, 
      createdById,
      isEscalated,
      page = 1,
      limit = 10
    } = req.query;
    
    // Construir el objeto de filtros
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (type) filters.type = type;
    if (assignedToId) filters.assignedToId = assignedToId;
    if (createdById) filters.createdById = createdById;
    if (isEscalated) filters.isEscalated = isEscalated === 'true';
    
    // Calcular offset para paginación
    const offset = (page - 1) * limit;
    
    // Obtener los incidentes con los filtros aplicados
    const { count, rows: incidents } = await Incident.findAndCountAll({
      where: filters,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'escalatedTo', attributes: ['id', 'username', 'fullName'] }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });
    
    // Calcular información de paginación
    const totalPages = Math.ceil(count / limit);
    
    return res.status(200).json({
      success: true,
      count,
      totalPages,
      currentPage: parseInt(page),
      incidents
    });
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los incidentes',
      error: error.message
    });
  }
};

// Obtener un incidente por ID
exports.getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const incident = await Incident.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'escalatedTo', attributes: ['id', 'username', 'fullName'] }
      ]
    });
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }
    
    // Obtener comentarios relacionados con este incidente
    const comments = await Comment.findAll({
      where: {
        entityType: 'incident',
        entityId: id
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    // Obtener archivos adjuntos relacionados con este incidente
    const attachments = await Attachment.findAll({
      where: {
        entityType: 'incident',
        entityId: id
      },
      include: [
        { model: User, as: 'uploadedBy', attributes: ['id', 'username', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      incident,
      comments,
      attachments
    });
  } catch (error) {
    console.error('Error al obtener incidente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el incidente',
      error: error.message
    });
  }
};

// Crear un nuevo incidente
exports.createIncident = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      priority, 
      assignedToId,
      slaHours 
    } = req.body;
    
    // El usuario que crea el incidente se obtiene del token JWT
    const createdById = req.user.id;
    
    // Crear el incidente en la base de datos
    const incident = await Incident.create({
      title,
      description,
      type,
      priority,
      createdById,
      assignedToId,
      slaHours: slaHours || process.env.DEFAULT_SLA_HOURS || 24,
      reportedAt: new Date()
    });
    
    // Si se asignó a un usuario, enviar notificación
    if (assignedToId) {
      await notificationService.createNotification({
        type: 'assignment',
        message: `Se te ha asignado un nuevo incidente: ${title}`,
        recipientId: assignedToId,
        entityType: 'incident',
        entityId: incident.id,
        data: {
          incidentId: incident.id,
          incidentTitle: title,
          assignedById: createdById
        }
      });
    }
    
    // Programar verificación de SLA
    slaService.scheduleSLACheck(incident.id, incident.dueDate);
    
    return res.status(201).json({
      success: true,
      message: 'Incidente creado exitosamente',
      incident
    });
  } catch (error) {
    console.error('Error al crear incidente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el incidente',
      error: error.message
    });
  }
};

// Actualizar un incidente existente
exports.updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      type, 
      priority, 
      status,
      assignedToId,
      isEscalated,
      escalatedToId,
      resolutionNotes,
      slaHours
    } = req.body;
    
    // Buscar el incidente
    const incident = await Incident.findByPk(id);
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }
    
    // Guardar valores anteriores para notificaciones
    const previousStatus = incident.status;
    const previousAssignee = incident.assignedToId;
    
    // Actualizar los campos del incidente
    incident.title = title || incident.title;
    incident.description = description || incident.description;
    incident.type = type || incident.type;
    incident.priority = priority || incident.priority;
    incident.assignedToId = assignedToId || incident.assignedToId;
    
    // Si se cambia el SLA, recalcular la fecha de vencimiento
    if (slaHours && slaHours !== incident.slaHours) {
      incident.slaHours = slaHours;
      
      // Calcular nueva fecha de vencimiento
      const dueDate = new Date(incident.reportedAt);
      dueDate.setHours(dueDate.getHours() + slaHours);
      incident.dueDate = dueDate;
      
      // Reprogramar verificación de SLA
      slaService.scheduleSLACheck(incident.id, incident.dueDate);
    }
    
    // Si se cambia el estado
    if (status && status !== previousStatus) {
      incident.status = status;
      
      // Si se resuelve el incidente, añadir notas de resolución
      if (status === 'resolved' && resolutionNotes) {
        incident.resolutionNotes = resolutionNotes;
        incident.resolvedAt = new Date();
      }
      
      // Si se cierra el incidente
      if (status === 'closed') {
        incident.closedAt = new Date();
      }
      
      // Notificar al creador sobre el cambio de estado
      await notificationService.createNotification({
        type: 'status_change',
        message: `El estado del incidente "${incident.title}" ha cambiado a ${status}`,
        recipientId: incident.createdById,
        entityType: 'incident',
        entityId: incident.id,
        data: {
          incidentId: incident.id,
          incidentTitle: incident.title,
          previousStatus,
          newStatus: status
        }
      });
    }
    
    // Si se escala el incidente
    if (isEscalated && !incident.isEscalated && escalatedToId) {
      incident.isEscalated = true;
      incident.escalatedToId = escalatedToId;
      incident.escalatedAt = new Date();
      incident.status = 'escalated';
      
      // Notificar a la persona a la que se escala
      await notificationService.createNotification({
        type: 'escalation',
        message: `Se te ha escalado el incidente "${incident.title}"`,
        recipientId: escalatedToId,
        entityType: 'incident',
        entityId: incident.id,
        data: {
          incidentId: incident.id,
          incidentTitle: incident.title,
          escalatedById: req.user.id
        }
      });
    }
    
    // Si se cambia el responsable
    if (assignedToId && assignedToId !== previousAssignee) {
      // Notificar al nuevo responsable
      await notificationService.createNotification({
        type: 'assignment',
        message: `Se te ha asignado el incidente "${incident.title}"`,
        recipientId: assignedToId,
        entityType: 'incident',
        entityId: incident.id,
        data: {
          incidentId: incident.id,
          incidentTitle: incident.title,
          assignedById: req.user.id
        }
      });
    }
    
    // Guardar los cambios
    await incident.save();
    
    return res.status(200).json({
      success: true,
      message: 'Incidente actualizado exitosamente',
      incident
    });
  } catch (error) {
    console.error('Error al actualizar incidente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el incidente',
      error: error.message
    });
  }
};

// Eliminar un incidente
exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    
    const incident = await Incident.findByPk(id);
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }
    
    // Verificar si el usuario tiene permisos para eliminar (admin o creador)
    if (req.user.role !== 'admin' && req.user.id !== incident.createdById) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este incidente'
      });
    }
    
    // Eliminar comentarios relacionados
    await Comment.destroy({
      where: {
        entityType: 'incident',
        entityId: id
      }
    });
    
    // Eliminar archivos adjuntos relacionados
    const attachments = await Attachment.findAll({
      where: {
        entityType: 'incident',
        entityId: id
      }
    });
    
    // Aquí podrías agregar código para eliminar los archivos físicos
    // antes de eliminar los registros en la base de datos
    
    await Attachment.destroy({
      where: {
        entityType: 'incident',
        entityId: id
      }
    });
    
    // Eliminar notificaciones relacionadas
    await Notification.destroy({
      where: {
        entityType: 'incident',
        entityId: id
      }
    });
    
    // Eliminar el incidente
    await incident.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Incidente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar incidente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el incidente',
      error: error.message
    });
  }
};

module.exports = exports;
