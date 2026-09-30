import { describe, expect, it } from 'vitest';
import { dpwhTitle } from './dpwh-text';

describe('dpwhTitle', () => {
  it('title-cases DPWH descriptions, keeping acronyms, codes and names', () => {
    expect(dpwhTitle('CSSP - SIPAG - CONSTRUCTION OF MULTI-PURPOSE BUILDING (COVERED COURT), ENRIQUE ZOBEL ELEMENTARY SCHOOL, CALATAGAN, BATANGAS')).toBe(
      'CSSP - SIPAG - Construction of Multi-Purpose Building (Covered Court), Enrique Zobel Elementary School, Calatagan, Batangas',
    );
    expect(dpwhTitle('WIDENING OF PERMANENT BRIDGES - MATALA BR. (B03179LZ) ALONG NASUGBU-LIAN-CALATAGAN RD - K0100 + 500')).toBe(
      'Widening of Permanent Bridges - Matala Br. (B03179LZ) along Nasugbu-Lian-Calatagan Rd - K0100 + 500',
    );
    expect(dpwhTitle('DRAINAGE SYSTEM IN POBLACION I, II, III, IV, CALATAGAN, BATANGAS 1ST LD')).toBe(
      'Drainage System in Poblacion I, II, III, IV, Calatagan, Batangas 1st LD',
    );
  });
});
