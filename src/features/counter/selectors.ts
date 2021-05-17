import { SystemState } from './types'

export const getEntities = (state: SystemState) => state.entitySystem.entities
export const getMin = (accountId: string, tokenId: string) => (
  state: SystemState
) => {
  const token = state.entitySystem.entities[tokenId]
  const tokenSettings = token.components.find(({ type }) => type === 'token')
  return (
    (tokenSettings?.balanceCheck ?? []).find(
      ({ address: addy, min: sMin }: { address: string; min?: number }) =>
        (addy === accountId || addy === '*') && sMin
    )?.min || 0
  )
}

export const getMax = (accountId: string, tokenId: string) => (
    state: SystemState
  ) => {
    const token = state.entitySystem.entities[tokenId]
    const tokenSettings = token.components.find(({ type }) => type === 'token')
    return (
      (tokenSettings?.balanceCheck ?? []).find(
        ({ address: addy, max: sMax }: { address: string; max?: number }) =>
          (addy === accountId || addy === '*') && sMax
      )?.max || 0
    )
  }