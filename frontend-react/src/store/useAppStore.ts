import { create } from 'zustand'

type Tab = 'prediction' | 'intervention' | 'students' | 'data' | 'chat'

interface AppState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void

  selectedStudentId: string | null
  setSelectedStudentId: (id: string | null) => void

  isStudentModalOpen: boolean
  openStudentModal: (studentId: string) => void
  closeStudentModal: () => void

  useLlm: boolean
  setUseLlm: (value: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'prediction',
  setActiveTab: (tab) => set({ activeTab: tab }),

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
}))
