import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/src/pages/LandingPage';
import { LoginPage } from '@/src/pages/LoginPage';
import { DashboardPage } from '@/src/pages/DashboardPage';
import { NewSurveyPage } from '@/src/pages/NewSurveyPage';
import { SurveyBuilderPage } from '@/src/pages/SurveyBuilderPage';
import { ResponsesPage } from '@/src/pages/ResponsesPage';
import { RespondentPage } from '@/src/pages/RespondentPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/surveys/new" element={<NewSurveyPage />} />
        <Route path="/surveys/:id/edit" element={<SurveyBuilderPage />} />
        <Route path="/surveys/:id/responses" element={<ResponsesPage />} />
        <Route path="/s/:slug" element={<RespondentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
