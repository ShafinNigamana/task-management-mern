import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/Login/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import TeamsPage from "../pages/Teams/TeamsPage";
import TasksPage from "../pages/Tasks/TasksPage";
import HealthPage from "../pages/System/HealthPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/health" element={<HealthPage />} />
    </Routes>
  );
}

export default AppRoutes;
