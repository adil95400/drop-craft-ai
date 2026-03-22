/**
 * Excel Export utility — uses dynamic imports to keep xlsx out of the initial bundle
 */

export interface ExcelSheet {
  name: string
  headers: string[]
  rows: (string | number)[][]
}

export async function exportToExcel(sheets: ExcelSheet[], filename: string) {
  const [XLSX, { saveAs }] = await Promise.all([
    import('xlsx'),
    import('file-saver'),
  ])

  const wb = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    const wsData = [sheet.headers, ...sheet.rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    const colWidths = sheet.headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...sheet.rows.map((r) => String(r[i] ?? '').length)
      )
      return { wch: Math.min(maxLen + 2, 40) }
    })
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
  })

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const ts = new Date().toISOString().slice(0, 10)
  saveAs(blob, `${filename}_${ts}.xlsx`)
}

export async function exportSalesExcel(data: Array<{ date: string; orders: number; revenue: number }>) {
  await exportToExcel([{
    name: 'Ventes',
    headers: ['Date', 'Commandes', 'Revenus (€)'],
    rows: data.map((d) => [d.date, d.orders, d.revenue]),
  }], 'rapport-ventes')
}

export async function exportInventoryExcel(data: Array<{ title: string; sku: string; stock: number; price: number }>) {
  await exportToExcel([{
    name: 'Inventaire',
    headers: ['Produit', 'SKU', 'Stock', 'Prix (€)'],
    rows: data.map((d) => [d.title, d.sku, d.stock, d.price]),
  }], 'rapport-inventaire')
}

export async function exportCustomersExcel(data: Array<{ name: string; email: string; orders_count: number; total_spent: number }>) {
  await exportToExcel([{
    name: 'Clients',
    headers: ['Nom', 'Email', 'Commandes', 'Total dépensé (€)'],
    rows: data.map((d) => [d.name, d.email, d.orders_count, d.total_spent]),
  }], 'rapport-clients')
}

export async function exportOrdersExcel(data: Array<{ order_number: string; customer_name: string; status: string; total: number; created_at: string }>) {
  await exportToExcel([{
    name: 'Commandes',
    headers: ['N° Commande', 'Client', 'Statut', 'Total (€)', 'Date'],
    rows: data.map((d) => [d.order_number, d.customer_name, d.status, d.total, d.created_at?.split('T')[0] || '']),
  }], 'rapport-commandes')
}
