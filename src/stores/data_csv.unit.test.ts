import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { z } from 'zod'
import {
  PrefSchema,
  SubprefectureSchema,
  CountySchema,
  MunicipalitySchema,
  MunicipalityVersionSchema,
  ChangeSchema,
} from '../types/municipality'

const DATA_DIR = path.resolve(__dirname, '../../public/data')

describe('CSV Data Integrity', () => {
  const validations = [
    { file: 'prefectures.csv', schema: PrefSchema },
    { file: 'subprefectures.csv', schema: SubprefectureSchema },
    { file: 'counties.csv', schema: CountySchema },
    { file: 'municipalities.csv', schema: MunicipalitySchema },
    { file: 'municipality_versions.csv', schema: MunicipalityVersionSchema },
    { file: 'change_events.csv', schema: ChangeSchema },
  ]

  test.each(validations)('$file の整合性チェック', ({ file, schema }) => {
    const text = readFileSync(path.join(DATA_DIR, file), 'utf-8')
    const { data, errors } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    })

    // 1. CSVパースエラーがないか確認
    expect(errors, `${file} のパースに失敗しました`).toEqual([])

    // 2. 配列全体をZodで一括検証
    const result = z.array(schema).safeParse(data)

    if (!result.success) {
      // エラーがあった場合、最初の3件程度を詳細に表示
      const details = result.error.issues
        .slice(0, 3)
        .map(
          (i) =>
            `行${(i.path[0] as number) + 2}: ${i.path.slice(1).join('.') || '全体'} - ${i.message}`,
        )
        .join('\n')
      throw new Error(`❌ ${file} でバリデーションエラーが発生しました:\n${details}`)
    }
  })
})
