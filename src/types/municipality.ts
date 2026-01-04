import { z } from 'zod'

// 都道府県のスキーマ
export const PrefSchema = z.object({
  code: z.string(),
  name: z.string(),
  yomi: z.string().optional().default(''),
})

// 振興局/支庁のスキーマ
export const SubprefectureSchema = z.object({
  code: z.string(),
  name: z.string(),
  yomi: z.string().default(''),
  prefecture_code: z.string(),
})

// 郡のスキーマ
export const CountySchema = z.object({
  code: z.string(),
  name: z.string(),
  yomi: z.string().default(''),
  prefecture_code: z.string(),
})

// 市区町村のスキーマ
export const CitySchema = z.object({
  code: z.string(),
  name: z.string(),
  yomi: z.string().default(''),
  prefecture_code: z.string(),
  subprefecture_code: z.string().default(''),
  county_code: z.string().default(''),
  valid_from: z.string().default(''),
  valid_to: z.string().default(''),
})

// 廃置分合イベントのスキーマ
export const ChangeSchema = z.object({
  code: z.string(),
  date: z.string(),
  event_type: z.string(),
  city_code_before: z.string(),
  city_code_after: z.string(),
})

// 型定義のエクスポート
export type Pref = z.infer<typeof PrefSchema>
export type Subprefecture = z.infer<typeof SubprefectureSchema>
export type County = z.infer<typeof CountySchema>
export type City = z.infer<typeof CitySchema>
export type Change = z.infer<typeof ChangeSchema>
