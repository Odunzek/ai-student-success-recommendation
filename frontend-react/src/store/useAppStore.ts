import { create } from 'zustand'
import type { InterventionResult } from '../types/intervention'

export type NavRoute = 'dashboard' | 'risk-assessment' | 'students' | 'interventions' | 'chat' | 'data'

interface AppState {
  activeRoute: NavRoute
  setActiveRoute: (route: NavRoute) => void

  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  selectedStudentId: string | null
  setSelectedStudentId: (id: string | null) => void

  isStudentModalOpen: boolean
  openStudentModal: (studentId: string) => void
  closeStudentModal: () => void

  useLlm: boolean
  setUseLlm: (value: boolean) => void

  isChatWidgetOpen: boolean
  toggleChatWidget: () => void
  setChatWidgetOpen: (open: boolean) => void

  // Intervention tab state persistence
  interventionStudentId: string | null
  interventionSearchQuery: string
  interventionResult: InterventionResult | null
  setInterventionStudentId: (id: string | null) => void
  setInterventionSearchQuery: (query: string) => void
  setInterventionResult: (result: InterventionResult | null) => void
  clearInterventionState: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeRoute: 'dashboard',
  setActiveRoute: (route) => set({ activeRoute: route }),

  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  selectedStudentId: null,
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),

  isStudentModalOpen: false,
  openStudentModal: (studentId) => set({
    selectedStudentId: studentId,
    isStudentModalOpen: true
  }),
  closeStudentModal: () => set({
    isStudentModalOpen: false,
    selectedStudentId: null
  }),

  useLlm: false,
  setUseLlm: (value) => set({ useLlm: value }),

  isChatWidgetOpen: false,
  toggleChatWidget: () => set((state) => ({ isChatWidgetOpen: !state.isChatWidgetOpen })),
  setChatWidgetOpen: (open) => set({ isChatWidgetOpen: open }),

  // Intervention tab state persistence
  interventionStudentId: null,
  interventionSearchQuery: '',
  interventionResult: null,
  setInterventionStudentId: (id) => set({ interventionStudentId: id }),
  setInterventionSearchQuery: (query) => set({ interventionSearchQuery: query }),
  setInterventionResult: (result) => set({ interventionResult: result }),
  clearInterventionState: () => set({
    interventionStudentId: null,
    interventionSearchQuery: '',
    interventionResult: null,
  }),
}))
