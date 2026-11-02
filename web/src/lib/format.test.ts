import { describe, expect, it } from 'vitest'

import { formatBytes, formatDate, formatDuration, formatSpeed, formatTimeRemaining } from './format'

describe('formatBytes', () => {
  it.each([
    [512, '512 B'],
    [18_300, '18 KB'],
    [4_800_000, '4.8 MB'],
    [48_300_000, '48 MB'],
    [2_500_000_000, '2.5 GB'],
  ])('formats %d as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected)
  })
})

describe('formatDuration', () => {
  it.each([
    [null, '—'],
    [0, '0:00'],
    [184, '3:04'],
    [3725, '1:02:05'],
  ])('formats %s as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('formats an ISO timestamp in the given locale', () => {
    expect(formatDate('2026-10-07T12:00:00Z', 'en-US')).toBe('Oct 7, 2026')
  })
})

describe('formatSpeed', () => {
  it('formats bytes per second', () => {
    expect(formatSpeed(4_200_000)).toBe('4.2 MB/s')
  })
})

describe('formatTimeRemaining', () => {
  it.each([
    [Infinity, ''],
    [-1, ''],
    [3, 'almost done'],
    [12.2, '13 s left'],
    [150, '3 min left'],
    [3725, '1 h 2 min left'],
  ])('formats %s seconds as "%s"', (seconds, expected) => {
    expect(formatTimeRemaining(seconds)).toBe(expected)
  })
})
