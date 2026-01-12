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

// 自治体バージョンのスキーマ
export const MunicipalityVersionSchema = z.object({
  municipality_id: z.string(),
  name: z.string().optional(),
  yomi: z.string().optional(),
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

// イベントタイプの定義
const EVENT_TYPES = [
  '成立',
  '新設',
  '編入',
  '分立',
  '市制施行',
  '町制施行',
  '名称変更',
  '郡変更',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

interface EventMetadata {
  birthName: string // 誕生・継続側の表示名
  extinctionName: string // 消滅・前身側の表示名
}

export const EVENT_METADATA: Record<EventType, EventMetadata> = {
  成立: { birthName: '成立', extinctionName: '成立' },
  新設: { birthName: '新設合併により誕生', extinctionName: '新設合併により消滅' },
  編入: { birthName: '編入', extinctionName: '編入により消滅' },
  分立: { birthName: '分立により誕生', extinctionName: '分立' },
  市制施行: { birthName: '市制施行', extinctionName: '市制施行' },
  町制施行: { birthName: '町制施行', extinctionName: '町制施行' },
  名称変更: { birthName: '名称変更', extinctionName: '名称変更' },
  郡変更: { birthName: '郡変更', extinctionName: '郡変更' },
}

// 廃置分合イベントのスキーマ
export const ChangeSchema = z.object({
  code: z.string(),
  date: z.string(),
  event_type: z.enum(EVENT_TYPES),
  municipality_id_before: z.string(),
  municipality_id_after: z.string(),
})

// 型定義のエクスポート
export type Pref = z.infer<typeof PrefSchema>
export type Subprefecture = z.infer<typeof SubprefectureSchema>
export type County = z.infer<typeof CountySchema>
export type MunicipalityVersion = z.infer<typeof MunicipalityVersionSchema>
export type Change = z.infer<typeof ChangeSchema>
