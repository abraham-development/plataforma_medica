'use client'
import { useEffect, useState } from 'react'
import { insforge } from '@/lib/insforge/client'
export function AdminTable({
  table,
  select,
  title,
}: {
  table: string
  select: string
  title: string
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    void (async () => {
      const result = await insforge.database
        .from(table)
        .select(select)
        .order('created_at', { ascending: false })
        .limit(200)
      if (result.error) setError(result.error.message)
      else setRows((result.data ?? []) as unknown as Record<string, unknown>[])
    })()
  }, [table, select])
  if (error) return <p className="card p-6 text-red-700">{error}</p>
  return (
    <section className="card overflow-hidden">
      <div className="border-b p-5">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full text-left text-sm">
          <thead className="bg-cloud">
            <tr>
              {rows[0] &&
                Object.keys(rows[0]).map((key) => (
                  <th className="p-3" key={key}>
                    {key}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="border-t" key={String(row.id ?? index)}>
                {Object.values(row).map((value, i) => (
                  <td className="max-w-xs truncate p-3" key={i}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-8 text-center text-slate-500">No hay registros.</p>}
      </div>
    </section>
  )
}
