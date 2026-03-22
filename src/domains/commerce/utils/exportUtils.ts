import { ImportJob, ImportedProductData } from '../services/importService'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

export const exportUtils = {
  exportHistoryToCSV(jobs: ImportJob[]) {
    const headers = ['Date', 'Type', 'Source', 'Statut', 'Total Lignes', 'Succès', 'Erreurs']
    const locale = getDateFnsLocale()
    
    const rows = jobs.map(job => [
      format(new Date(job.created_at), 'dd/MM/yyyy HH:mm', { locale }),
      this.getSourceTypeLabel(job.source_type),
      job.source_url || job.source_name || '-',
      this.getStatusLabel(job.status),
      job.total_rows || 0,
      job.success_rows || 0,
      job.error_rows || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    this.downloadFile(csvContent, `import-history-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
  },

  async exportHistoryToExcel(jobs: ImportJob[]) {
    const XLSX = await import('xlsx')
    const locale = getDateFnsLocale()
    const data = jobs.map(job => ({
      'Date': format(new Date(job.created_at), 'dd/MM/yyyy HH:mm', { locale }),
      'Type': this.getSourceTypeLabel(job.source_type),
      'Source': job.source_url || job.source_name || '-',
      'Statut': this.getStatusLabel(job.status),
      'Total Lignes': job.total_rows || 0,
      'Succès': job.success_rows || 0,
      'Erreurs': job.error_rows || 0,
      'Démarré': job.started_at ? format(new Date(job.started_at), 'dd/MM/yyyy HH:mm') : '-',
      'Terminé': job.completed_at ? format(new Date(job.completed_at), 'dd/MM/yyyy HH:mm') : '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historique Imports')

    const maxWidth = data.reduce((w, r) => Math.max(w, ...Object.values(r).map(v => String(v).length)), 10)
    worksheet['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }))

    XLSX.writeFile(workbook, `import-history-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  },

  exportProductsToCSV(products: ImportedProductData[]) {
    const headers = ['Nom', 'SKU', 'Prix', 'Prix Coût', 'Stock', 'Catégorie', 'Statut', 'Date Import']
    const locale = getDateFnsLocale()
    
    const rows = products.map(product => [
      product.name,
      product.sku || '-',
      product.price,
      product.cost_price || 0,
      product.stock_quantity || 0,
      product.category || '-',
      product.status,
      format(new Date(product.created_at), 'dd/MM/yyyy HH:mm', { locale })
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    this.downloadFile(csvContent, `products-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
  },

  async exportProductsToExcel(products: ImportedProductData[]) {
    const XLSX = await import('xlsx')
    const locale = getDateFnsLocale()
    const data = products.map(product => ({
      'Nom': product.name,
      'Description': product.description || '-',
      'SKU': product.sku || '-',
      'Prix': product.price,
      'Prix Coût': product.cost_price || 0,
      'Devise': product.currency,
      'Stock': product.stock_quantity || 0,
      'Catégorie': product.category || '-',
      'Marque': product.brand || '-',
      'Statut': product.status,
      'AI Optimisé': product.ai_optimized ? 'Oui' : 'Non',
      'Date Import': format(new Date(product.created_at), 'dd/MM/yyyy HH:mm', { locale })
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits')

    worksheet['!cols'] = [
      { wch: 30 }, { wch: 50 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
      { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 18 },
    ]

    XLSX.writeFile(workbook, `products-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  },

  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  getSourceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'file_upload': 'Fichier', 'url_import': 'URL', 'xml_import': 'XML/RSS',
      'api_sync': 'API', 'ftp_import': 'FTP'
    }
    return labels[type] || type
  },

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente', 'processing': 'En cours',
      'completed': 'Terminé', 'failed': 'Échoué'
    }
    return labels[status] || status
  }
}
