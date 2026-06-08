import { useParams } from 'react-router-dom';

function TaskDetailPage() {
  const { id } = useParams();
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Task Details</h1>
        <p className="dashboard-subtitle">Task ID: {id}</p>
      </div>
    </div>
  );
}

export default TaskDetailPage;