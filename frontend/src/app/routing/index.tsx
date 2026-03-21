import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { Skeleton } from '../../shared/ui';

const LandingPage = lazy(() => import('../../pages/landing'));
const CatalogPage = lazy(() => import('../../pages/catalog'));
const MaterialDetailPage = lazy(() => import('../../pages/material-detail'));
const CourseViewerPage = lazy(() => import('../../pages/course-viewer'));
const AddMaterialPage = lazy(() => import('../../pages/add-material'));
const CommunitiesPage = lazy(() => import('../../pages/communities'));
const CommunityDetailPage = lazy(() => import('../../pages/community-detail'));
const ChatPage = lazy(() => import('../../pages/chat'));
const TasksPage = lazy(() => import('../../pages/tasks'));
const MentorsPage = lazy(() => import('../../pages/mentors'));
const ProjectsPage = lazy(() => import('../../pages/projects'));
const RoadmapPage = lazy(() => import('../../pages/roadmap'));
const SchedulePage = lazy(() => import('../../pages/schedule'));
const ProfilePage = lazy(() => import('../../pages/profile'));
const WalletPage = lazy(() => import('../../pages/wallet'));
const LoginPage = lazy(() => import('../../pages/auth'));
const NotificationsPage = lazy(() => import('../../pages/notifications'));
const ProfileEditPage = lazy(() => import('../../pages/profile-edit'));
const NotFoundPage = lazy(() => import('../../pages/not-found'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function AppRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:id" element={<MaterialDetailPage />} />
          <Route path="/catalog/:id/learn" element={<CourseViewerPage />} />
          <Route path="/add-material" element={<AddMaterialPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/:slug" element={<CommunityDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/mentors" element={<MentorsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
