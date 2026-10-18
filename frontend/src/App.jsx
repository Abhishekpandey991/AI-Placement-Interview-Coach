import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewRoom from "./pages/InterviewRoom";
import Results from "./pages/Results";

import ProtectedRoute from "./components/ProtectedRoute";

import Analytics from "./pages/Analytics";
import Preparation from "./pages/Preparation";
import Dsa from "./pages/DSA";
import SystemDesign from "./pages/SystemDesign";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeHistory from "./pages/ResumeHistory";
import Chatbot from "./pages/Chatbot";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
   
      <Routes>

        {/* Public Routes */}

        <Route
          path="/"
          element={
            localStorage.getItem("access_token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Home />)}/>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        {/* Protected Routes */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/interview/setup"
            element={<InterviewSetup />}
          />

          <Route
            path="/interview"
            element={<InterviewRoom />}
          />

          <Route
            path="/results"
            element={<Results />}
          />
          <Route
          path="/resume-analyzer"
          element={<ResumeAnalyzer />}
          />
          <Route
            path="/resume-history"
            element={<ResumeHistory />}
          />
          <Route
          path="/resume-analysis/:analysisId"
          element={<ResumeAnalyzer />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/preparation"
            element={<Preparation />}
          />

          <Route
            path="/dsa"
            element={<Dsa />}
          />

          <Route
            path="/system-design"
            element={<SystemDesign />}
          />
          <Route path="/mentor" element={<Chatbot />} />
       

        </Route>

      </Routes>
   
  );
}

export default App;