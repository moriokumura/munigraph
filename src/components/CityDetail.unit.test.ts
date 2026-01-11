import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CityDetail from './CityDetail.vue'
import type { City, Municipality } from '@/types/municipality'

describe('CityDetail.vue', () => {
  const mockCity: City = {
    code: '01233_19720401',
    city_code: '01233',
    name: '伊達市',
    yomi: 'だてし',
    prefecture_code: '01',
    subprefecture_code: '01013',
    county_code: '',
    valid_from: '1972-04-01',
    valid_to: '',
  }

  const mockHistoryCity: City = {
    code: '01576_initial',
    city_code: '01576',
    name: '伊達町',
    yomi: 'だてちょう',
    prefecture_code: '01',
    subprefecture_code: '01013',
    county_code: '01069',
    valid_from: '1900-01-01',
    valid_to: '1972-04-01',
  }

  const mockMunicipality: Municipality = {
    id: '01233-伊達市',
    name: '伊達市',
    yomi: 'だてし',
    prefecture_code: '01',
    versions: [mockCity],
  }

  it('現存する自治体の存続期間が正しく表示されること', () => {
    const pinia = createTestingPinia({
      initialState: {
        data: {
          loaded: true,
          cityByCode: new Map([[mockCity.code, mockCity]]),
          eventsByAfter: new Map(),
          eventsByBefore: new Map(),
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

    expect(wrapper.text()).toContain('1972/04/01〜現存')
  })

  it('消滅した自治体の存続期間が正しく表示されること', () => {
    const mockMuniExtinct: Municipality = {
      id: '01576-伊達町',
      name: '伊達町',
      yomi: 'だてちょう',
      prefecture_code: '01',
      versions: [mockHistoryCity],
    }

    const pinia = createTestingPinia({
      initialState: {
        data: {
          loaded: true,
          cityByCode: new Map([[mockHistoryCity.code, mockHistoryCity]]),
          eventsByAfter: new Map(),
          eventsByBefore: new Map(),
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

    expect(wrapper.text()).toContain('1900/01/01〜1972/04/01')
  })

  it('イベントの日付が「yyyy年M月d日」形式で表示されること', async () => {
    const mockChange = {
      code: 'event1',
      date: '1972-04-01',
      event_type: '市制施行',
      city_code_before: '01576_initial',
      city_code_after: '01233_19720401',
    }

    const pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        data: {
          loaded: true,
          changes: [mockChange],
          cityByCode: new Map([
            ['01576_initial', mockHistoryCity],
            ['01233_19720401', mockCity],
          ]),
          eventsByAfter: new Map([['01233_19720401', [mockChange]]]),
          eventsByBefore: new Map([['01576_initial', [mockChange]]]),
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
