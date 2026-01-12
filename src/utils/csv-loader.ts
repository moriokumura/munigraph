import Papa from 'papaparse'

/**
 * CSVファイルを読み込んでパースする
 * @param path CSVファイルのパス
 * @returns パースされたCSVデータ（オブジェクトの配列）
 */
export async function fetchCsv(path: string): Promise<Record<string, string>[]> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`)
  }

  const text = await res.text()
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  })

  // パースエラーがある場合は警告を表示
  if (parsed.errors.length > 0) {
    console.warn(`CSV parse warnings for ${path}:`, parsed.errors.slice(0, 3))
  }

  return parsed.data
}
