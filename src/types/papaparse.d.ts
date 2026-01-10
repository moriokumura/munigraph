declare module 'papaparse' {
  export interface ParseConfig {
    header?: boolean
    skipEmptyLines?: boolean
    [key: string]: unknown
  }
  export interface ParseError {
    type: string
    code: string
    message: string
    row: number
  }
  export interface ParseMeta {
    delimiter: string
    linebreak: string
    aborted: boolean
    truncated: boolean
    cursor: number
    fields?: string[]
  }
  export interface ParseResult<T> {
    data: T[]
    errors: ParseError[]
    meta: ParseMeta
  }
  export function parse<T>(text: string, config?: ParseConfig): ParseResult<T>
  const Papa: {
    parse: typeof parse
  }
  export default Papa
}
