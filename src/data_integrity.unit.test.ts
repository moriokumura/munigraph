import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { CitySchema } from './types/municipality'

describe('Data Integrity', () => {
  it('現存する自治体数が正確に1747件であること', () => {
    const csvPath = path.resolve(process.cwd(), 'public/data/cities.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf8')

    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    })

    const cities = parsed.data.map(r => CitySchema.parse(r))

    // 現存自治体の抽出ロジック（ストアの実装と合わせる）
    const currentCities = cities.filter(
      city =>
        (!city.valid_to || city.valid_to.trim() === '') && city.name && city.name.trim() !== ''
    )

    // 自治体エンティティとしての集約ロジック
    const municipalityIds = new Set()
    for (const city of currentCities) {
      const mId = `${city.city_code}-${city.name}`
      municipalityIds.add(mId)
    }

    expect(municipalityIds.size).toBe(1747)
  })

  it('泊村が2つ別の自治体として認識されていること', () => {
    const csvPath = path.resolve(process.cwd(), 'public/data/cities.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf8')

    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    })

    const tomariCount = (parsed.data as Record<string, string>[]).filter(
      r => r.name === '泊村' && (!r.valid_to || r.valid_to.trim() === '')
    ).length

    expect(tomariCount).toBe(2)
  })
})
