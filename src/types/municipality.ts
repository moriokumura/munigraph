import { z } from 'zod'

// 都道府県のスキーマ
export const PrefSchema = z.object({
  code: z.string(),
  name: z.string(),
  yomi: z.string().optional().default(''),
})

// 支庁のスキーマ
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

// 市区町村バージョンのスキーマ（旧City）
export const MunicipalityVersionSchema = z.object({
  id: z.string(),
  municipality_id: z.string(),
  city_code: z.string().default(''),
  subprefecture_code: z.string().default(''),
  county_code: z.string().default(''),
  valid_from: z.string().default(''),
  valid_to: z.string().default(''),
})

// 自治体エンティティのスキーマ
export const MunicipalitySchema = z.object({
  id: z.string(),
  name: z.string(),
  yomi: z.string().default(''),
  prefecture_code: z.string(),
})

// 自治体エンティティ（関連する全バージョンを含む）
export interface Municipality {
  id: string
  name: string
  yomi: string
  prefecture_code: string
  versions: MunicipalityVersion[]
}

// 廃置分合イベントのスキーマ
export const ChangeSchema = z.object({
  code: z.string(),
  date: z.string(),
  event_type: z.string(),
  city_code_before: z.string(), // 旧来の互換性のため名称は維持（実体はMunicipalityVersion.id）
  city_code_after: z.string(), // 同上
})

// 型定義のエクスポート
export type Pref = z.infer<typeof PrefSchema>
export type Subprefecture = z.infer<typeof SubprefectureSchema>
export type County = z.infer<typeof CountySchema>
export type MunicipalityVersion = z.infer<typeof MunicipalityVersionSchema>
export type Change = z.infer<typeof ChangeSchema>
