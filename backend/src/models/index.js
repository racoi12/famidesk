const { sequelize } = require('../config/database');
const User = require('./user.model');
const Incident = require('./incident.model');
const Comment = require('./comment.model');
const Attachment = require('./attachment.model');
const Notification = require('./notification.model');

// Definir relaciones entre modelos

// Relaciones de User
User.hasMany(Incident, { 
  foreignKey: 'createdById', 
  as: 'createdIncidents'
});
User.hasMany(Incident, { 
  foreignKey: 'assignedToId', 
  as: 'assignedIncidents'
});
User.hasMany(Incident, { 
  foreignKey: 'escalatedToId', 
  as: 'escalatedIncidents'
});
User.hasMany(Comment, { 
  foreignKey: 'userId',
  as: 'comments'
});
User.hasMany(Attachment, { 
  foreignKey: 'uploadedById',
  as: 'uploads'
});
User.hasMany(Notification, { 
  foreignKey: 'recipientId',
  as: 'notifications'
});

// Relaciones de Incident
Incident.belongsTo(User, { 
  foreignKey: 'createdById', 
  as: 'creator'
});
Incident.belongsTo(User, { 
  foreignKey: 'assignedToId', 
  as: 'assignee'
});
Incident.belongsTo(User, { 
  foreignKey: 'escalatedToId', 
  as: 'escalatedTo'
});

// Exportar los modelos
module.exports = {
  sequelize,
  User,
  Incident,
  Comment,
  Attachment,
  Notification
};
