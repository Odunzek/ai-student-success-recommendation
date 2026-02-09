/**
 * AppLayout.tsx - Main application layout wrapper
 *
 * This component provides the consistent layout structure for all pages:
 * - Sidebar navigation (collapsible)
 * - Top header with search
 * - Main content area
 * - Global modals (StudentModal, ChatWidget)
 */

import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { ChatWidget } from '../chat/ChatWidget'
import { StudentModal } from '../students/StudentModal'
import { useAppStore } from '../../store/useAppStore'
import { useMediaQuery } from '../../lib/hooks'
import { cn } from '../../lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  // Layout state
  const isSidebarCollapsed = useAppStore((s) => s.isSidebarCollapsed)
  const activeRoute = useAppStore((s) => s.activeRoute)
  const isMobile = useMediaQuery('(max-width: 1024px)')

  // Global student modal state - allows opening modal from any page
  const isStudentModalOpen = useAppStore((s) => s.isStudentModalOpen)
  const selectedStudentId = useAppStore((s) => s.selectedStudentId)
  const closeStudentModal = useAppStore((s) => s.closeStudentModal)

  // Hide floating chat widget when on full-page chat
  const showWidget = activeRoute !== 'chat'

  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          // On mobile, no left margin (sidebar is overlay)
          isMobile ? 'ml-0' : (isSidebarCollapsed ? 'ml-20' : 'ml-64')
        )}
      >
        <TopHeader />
        <main className="p-4 sm:p-6" role="main">
          {children}
        </main>
      </div>

      {/* Floating chat widget - hidden on full chat page */}
      {showWidget && <ChatWidget />}

      {/* Global Student Modal - accessible from any page (Dashboard, Students, etc.) */}
      <StudentModal
        isOpen={isStudentModalOpen}
        studentId={selectedStudentId}
        onClose={closeStudentModal}
      />
    </div>
  )
}
