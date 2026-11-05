import { describe, expect, it } from 'vitest';
import { UNVERIFIED_OFFICIALS as SCRIPT_OFFICIALS, WITHHELD_VALUES as SCRIPT_VALUES, pagePasses, redactNames } from './withheld.mjs';
import { UNVERIFIED_OFFICIALS, WITHHELD_VALUES } from '../../worker/src/guard';

describe('withheld lists for document text', () => {
  it('equal the assistant guard lists', () => {
    expect([...SCRIPT_OFFICIALS].sort()).toEqual([...UNVERIFIED_OFFICIALS].sort());
    expect([...SCRIPT_VALUES].sort()).toEqual([...WITHHELD_VALUES].sort());
  });

  it('drops pages with officials, withheld values or contacts', () => {
    expect(pagePasses('Signed: Hon. Juan Pantoja, Punong Barangay')).toBe(false);
    expect(pagePasses('Call (043) 419-0150 for details')).toBe(false);
    expect(pagePasses('Write to office@calatagan.gov.ph')).toBe(false);
    expect(pagePasses('Mobile 0917 123 4567')).toBe(false);
    expect(pagePasses('Ni: Mayor S ophia G . P alacio, MD')).toBe(false);
    expect(pagePasses('Signed by the Punong Barangay of each barangay')).toBe(true);
  });

  it('keeps ordinary text, including amounts and dates', () => {
    expect(pagePasses('Business permit: requirements are a barangay clearance and a DTI registration. Fee: ₱500. Processing time: 1 day, 2026.')).toBe(true);
    expect(pagePasses('Contract amount: Php 1,234,567.00 awarded on 12 March 2018.')).toBe(true);
  });
});

describe('redactNames', () => {
  it.each([
    ['An Order Appointing Hon. Glenn Z. Aytona, July 4, 2012', 'An Order Appointing [name withheld], July 4, 2012'],
    ['Hon. Peter P. Laurel Vice Governor & Presiding Officer', '[name withheld] Vice Governor & Presiding Officer'],
    ['Prepared by: JUAN M. DELA CRUZ', 'Prepared by: [name withheld]'],
    ['Noted: Maria Clara S. Reyes-Santos, Jr.', 'Noted: [name withheld]'],
    ['Cruz, Juan M. (Municipal Treasurer)', '[name withheld] (Municipal Treasurer)'],
    ['Ni: Mayor S ophia G . R amos, MD', 'Ni: [name withheld], MD'],
    ['Transmit to Mayor’s Office Jan. 23, 2015', 'Transmit to Mayor’s Office Jan. 23, 2015'],
    ['RESOLUTION AUTHORIZING THE MUNICIPAL MAYOR TO ENTER INTO A MOA', 'RESOLUTION AUTHORIZING THE MUNICIPAL MAYOR TO ENTER INTO A MOA'],
  ])('%s', (input, expected) => expect(redactNames(input)).toBe(expected));

  it('keeps organisations, places, amounts and requirements', () => {
    const text = 'Awarded to LLEB CONSTRUCTION AND TRADING, Brgy. Lucsuhin, Calatagan, Batangas. Amount: Php 1,234,567.00. Requirements: Barangay Clearance, DTI Registration.';
    expect(redactNames(text)).toBe(text);
  });
});
