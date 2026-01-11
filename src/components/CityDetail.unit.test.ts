import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CityDetail from './CityDetail.vue'
import type { MunicipalityVersion, Municipality } from '@/types/municipality'

describe('CityDetail.vue', () => {
  const mockCity: MunicipalityVersion = {
    municipality_id: 'M002',
    city_code: '01233',
    subprefecture_code: '01013',
    county_code: '',
    valid_from: '1972-04-01',
    valid_to: '',
  }

  const mockHistoryCity: MunicipalityVersion = {
    municipality_id: 'M001',
    city_code: '01576',
    subprefecture_code: '01013',
    county_code: '01069',
    valid_from: '1900-01-01',
    valid_to: '1972-04-01',
  }

  const mockMunicipality: Municipality = {
    id: 'M002',
    name: '伊達市',
    yomi: 'だてし',
    prefecture_code: '01',
    versions: [mockCity],
  }

  it('現存する自治体の情報が表示されること', () => {
    const pinia = createTestingPinia({
      initialState: {
        data: {
          loaded: true,
          municipalityById: new Map([[mockMunicipality.id, mockMunicipality]]),
          eventsByAfter: new Map(),
          eventsByBefore: new Map(),
          prefByCode: new Map([['01', { code: '01', name: '北海道', yomi: 'ほっかいどう' }]]),
          countyByCode: new Map(),
          subprefByCode: new Map([
            ['01013', { code: '01013', name: '胆振総合振興局', yomi: 'いぶり' }],
          ]),
        },
      },
      stubActions: false,
    })

    const wrapper = mount(CityDetail, {
      props: {
        selectedCity: mockCity,
        selectedMunicipality: mockMunicipality,
      },
      global: {
        plugins: [pinia],
      },
    })

    // イベントなしの初期状態は「成立」となる（日付があるので「日付未登録」ではない）
    expect(wrapper.text()).toContain('成立')
    expect(wrapper.text()).toContain('現在')
  })

  it('消滅した自治体の情報が表示されること', () => {
    const mockMuniExtinct: Municipality = {
      id: 'M001',
      name: '伊達町',
      yomi: 'だてちょう',
      prefecture_code: '01',
      versions: [mockHistoryCity],
    }

    const pinia = createTestingPinia({
      initialState: {
        data: {
          loaded: true,
          municipalityById: new Map([[mockMuniExtinct.id, mockMuniExtinct]]),
          eventsByAfter: new Map(),
          eventsByBefore: new Map(),
          prefByCode: new Map([['01', { code: '01', name: '北海道', yomi: 'ほっかいどう' }]]),
          countyByCode: new Map([['01069', { code: '01069', name: '有珠郡', yomi: 'うす' }]]),
          subprefByCode: new Map([
            ['01013', { code: '01013', name: '胆振総合振興局', yomi: 'いぶり' }],
          ]),
        },
      },
      stubActions: false,
    })

    const wrapper = mount(CityDetail, {
      props: {
        selectedCity: mockHistoryCity,
        selectedMunicipality: mockMuniExtinct,
      },
      global: {
        plugins: [pinia],
      },
    })

    // 最初のバージョン（イベントなし）が表示される
    expect(wrapper.text()).toContain('成立')
    expect(wrapper.text()).not.toContain('現在')
  })

  it('イベントの日付が「yyyy年M月d日」形式で表示されること', async () => {
    const mockChange = {
      code: 'event1',
      date: '1972-04-01',
      event_type: '市制施行',
      municipality_id_before: 'M001',
      municipality_id_after: 'M002',
    }

    const pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        data: {
          loaded: true,
          changes: [mockChange],
          municipalityById: new Map<string, Municipality>([
            [
              'M001',
              {
                id: 'M001',
                name: '伊達町',
                yomi: 'だてちょう',
                prefecture_code: '01',
                versions: [mockHistoryCity],
              },
            ],
            ['M002', mockMunicipality],
          ]),
          eventsByAfter: new Map([['M002', [mockChange]]]),
          eventsByBefore: new Map([['M001', [mockChange]]]),
          prefByCode: new Map([['01', { code: '01', name: '北海道' }]]),
          countyByCode: new Map([['01069', { code: '01069', name: '有珠郡' }]]),
          subprefByCode: new Map([['01013', { code: '01013', name: '胆振総合振興局' }]]),
        },
      },
    })

    const wrapper = mount(CityDetail, {
      props: {
        selectedCity: mockCity,
        selectedMunicipality: mockMunicipality,
      },
      global: {
        plugins: [pinia],
      },
    })

    expect(wrapper.text()).toContain('1972年4月1日')
  })
})
