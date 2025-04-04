import React, { useState, useEffect } from 'react';
import incidentService from '../services/incident.service';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
  });

  useEffect(() => {
    fetchIncidents();
  }, [currentPage, filters]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await incidentService.getAllIncidents({
        page: currentPage,
        limit: 10,
        ...filters
      });
      
      setIncidents(response.incidents || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Error al cargar los incidentes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    // Resetear a la primera página cuando se aplica un filtro
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div>
      <h1 className="page-header">Gestión de Incidentes</h1>
      
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">Filtros</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">Todos</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En progreso</option>
              <option value="escalated">Escalado</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label htmlFor="priority">Prioridad</label>
            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label htmlFor="type">Tipo</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">Todos</option>
              <option value="bug">Bug</option>
              <option value="error">Error</option>
              <option value="request">Solicitud</option>
              <option value="issue">Problema</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary">
          Nuevo Incidente
        </button>
      </div>

      {loading ? (
        <p>Cargando incidentes...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : incidents.length === 0 ? (
        <p>No hay incidentes que coincidan con los filtros.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Título</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tipo</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Prioridad</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Estado</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Vencimiento</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Asignado a</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '0.75rem' }}>{incident.title}</td>
                  <td style={{ padding: '0.75rem' }}>{incident.type}</td>
                  <td style={{ padding: '0.75rem' }}>{incident.priority}</td>
                  <td style={{ padding: '0.75rem' }}>{incident.status}</td>
                  <td style={{ padding: '0.75rem' }}>{new Date(incident.dueDate).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem' }}>{incident.assignee?.fullName || 'No asignado'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
                      Ver
                    </button>
                    <button className="btn btn-danger">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-primary"
              style={{ marginRight: '0.5rem' }}
            >
              Anterior
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-primary"
              style={{ marginLeft: '0.5rem' }}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Incidents;
