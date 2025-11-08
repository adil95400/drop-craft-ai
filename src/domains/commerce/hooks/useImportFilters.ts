import { useState, useMemo } from 'react'
import { ImportJob } from '../services/importService'
import { ImportFilters } from '../components/import/ImportHistoryFilters'
import { isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'

export const useImportFilters = (jobs: ImportJob[]) => {
  const [filters, setFilters] = useState<ImportFilters>({})

  const filteredJobs = useMemo(() => {
    let result = [...jobs]

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(job => 
        job.source_url?.toLowerCase().includes(searchLower) ||
        job.source_name?.toLowerCase().includes(searchLower) ||
        job.source_type?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre par statut
    if (filters.status) {
      result = result.filter(job => job.status === filters.status)
    }

    // Filtre par type de source
    if (filters.sourceType) {
      result = result.filter(job => job.source_type === filters.sourceType)
    }

    // Filtre par date de début
    if (filters.dateFrom) {
      const fromDate = startOfDay(filters.dateFrom)
      result = result.filter(job => 
        isAfter(new Date(job.created_at), fromDate) || 
        new Date(job.created_at).getTime() === fromDate.getTime()
      )
    }

    // Filtre par date de fin
    if (filters.dateTo) {
      const toDate = endOfDay(filters.dateTo)
      result = result.filter(job => 
        isBefore(new Date(job.created_at), toDate) || 
        new Date(job.created_at).getTime() === toDate.getTime()
      )
    }

    return result
  }, [jobs, filters])

  const resetFilters = () => {
    setFilters({})
  }

  return {
    filters,
    setFilters,
    filteredJobs,
    resetFilters,
    hasActiveFilters: Object.keys(filters).some(key => filters[key as keyof ImportFilters] !== undefined)
  }
}
