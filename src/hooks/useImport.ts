import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface ImportHistory {
  id: string
  source_type: string
  source_url?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  products_imported: number
  errors_count: number
  created_at: string
  updated_at: string
}

export const useImport = () => {
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([
    {
      id: '1',
      source_type: 'url',
      source_url: 'https://aliexpress.com/product/123',
      status: 'completed',
      products_imported: 15,
      errors_count: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      source_type: 'csv',
      status: 'completed',
      products_imported: 8,
      errors_count: 0,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const addImportRecord = (importData: Omit<ImportHistory, 'id' | 'created_at' | 'updated_at'>) => {
    const newRecord: ImportHistory = {
      ...importData,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setImportHistory(prev => [newRecord, ...prev])
    return newRecord
  }

  const updateImportRecord = (id: string, updates: Partial<ImportHistory>) => {
    setImportHistory(prev => 
      prev.map(record => 
        record.id === id 
          ? { ...record, ...updates, updated_at: new Date().toISOString() }
          : record
      )
    )
  }

  return {
    importHistory,
    loading,
    addImportRecord,
    updateImportRecord,
    refetch: () => {}
  }
}