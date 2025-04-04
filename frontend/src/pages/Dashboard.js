import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import incidentService from '../services/incident.service';

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        // Obtener incidentes asignados al usuario actual
        const response = await incidentService.getAllIncidents({
          assignedToId: currentUser.id,
          limit: 5
        });
        setIncidents(response.incidents || []);
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError('Error al cargar los incidentes');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [currentUser.id]);

  return (
    <div>
      <h1 className="page-header">Dashboard</h1>
      
      <div className="card">
        <div className="card-header">Bienvenido, {currentUser.fullName}</div>
        <div>
          <p>Rol: {currentUser.role}</p>
          <p>Último inicio de sesión: {new Date(currentUser.lastLogin).toLocaleString()}</p>
        </div>
      </div>

      <h2>Incidentes asignados</h2>
      {loading ? (
        <p>Cargando incidentes...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : incidents.length === 0 ? (
        <p>No tienes incidentes asignados actualmente.</p>
      ) : (
        <div className="grid">
          {incidents.map((incident) => (
            <div key={incident.id} className="card">
              <div className="card-header">{incident.title}</div>
              <div>
                <p><strong>Tipo:</strong> {incident.type}</p>
                <p><strong>Prioridad:</strong> {incident.priority}</p>
                <p><strong>Estado:</strong> {incident.status}</p>
                <p><strong>Vencimiento:</strong> {new Date(incident.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
