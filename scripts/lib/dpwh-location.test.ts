import { describe, expect, it } from 'vitest';
import { barangaysIn, classify } from './dpwh-location.mjs';

const batangas = { province: 'Batangas 1st DEO', region: 'Region IV-A' };
const at = (description: string, location = batangas) => classify({ description, location });

// Every description below is a real DPWH record's.
describe('classify', () => {
  it('keeps work the description places in Calatagan', () => {
    expect(at('CONSTRUCTION OF MPB IN PARAISO ELEMENTARY SCHOOL, CALATAGAN, BATANGAS')).toBe('calatagan');
    expect(at('MULTI-PURPOSE COVERED COURT, BRGY. GULOD, CALATAGAN, BATANGAS-PHASE II')).toBe('calatagan');
    expect(at('(CONSTRUCTION OF STAGE CONNECTING 2 BUILDINGS),BARANGAY TALISAY, CALATAGAN')).toBe('calatagan');
    expect(at('CONSTRUCTION OF PUBLIC WATER SUPPLY SYSTEM IN CALATAGAN, BATANGAS')).toBe('calatagan');
    expect(
      at('REPLACEMENT OF BAGBAY BR. (B00051LZ) ALONG NASUGBU-LIAN-CALATAGAN RD, CALATAGAN, BATANGAS'),
    ).toBe('calatagan');
    expect(
      at('ACCESS ROAD LEADING TO CALATAGAN PORT, CALATAGAN, BATANGAS', { province: 'Region IV-A', region: 'Region IV-A' }),
    ).toBe('calatagan');
  });

  it('does not count the national road just because it is named after Calatagan', () => {
    expect(at('MATALA BR. (B03179LZ) ALONG NASUGBU-LIAN-CALATAGAN RD, LIAN, BATANGAS')).toBe('elsewhere');
    expect(at('SECONDARY ROADS - NASUGBU-LIAN-CALATAGAN RD - K0100 + 500 - K0101 + 244')).toBe('road');
  });

  it('separates multi-municipality packages', () => {
    expect(
      at('1. CONC OF RD IN BRGY. SAN DIEGO, LIAN; 2. CONC OF RD IN BRGY. QUILITISAN, CALATAGAN; 3. CONST OF FMR IN BRGY. MUNTING INDANG, NASUGBU; 4. CONC OF RD IN BRGY. TANAGAN, CALATAGAN, BATANGAS'),
    ).toBe('shared');
    expect(at('CONCRETING OF ROAD, BRGY. CARRETONAN, CALATAGAN; MUNICIPAL PLAZA, BRGY. LUNA, TUY, BATANGAS')).toBe('shared');
  });

  it('ignores other places called Calatagan', () => {
    const makati = { province: 'Metro Manila 2nd DEO', region: 'National Capital Region' };
    expect(at('REVETMENT WALL ALONG CALATAGAN CREEK, BRGY. PALANAN, MAKATI CITY, METRO MANILA', makati)).toBe('elsewhere');
    const virac = { province: 'Catanduanes DEO', region: 'Region V' };
    expect(at('CONSTRUCTION OF MULTI-PURPOSE BUILDING, CALATAGAN TIBANG, VIRAC, CATANDUANES', virac)).toBe('elsewhere');
  });
});

describe('barangaysIn', () => {
  it('reads DPWH spellings, including the Poblacion lists', () => {
    expect(barangaysIn('CONCRETING OF ROAD, BRGY. 1, 2, 3 AND 4, CALATAGAN, BATANGAS')).toEqual([
      '0401008016', '0401008017', '0401008018', '0401008019',
    ]);
    expect(barangaysIn('DRAINAGE SYSTEM IN POBLACION I, II, III, IV, CALATAGAN, BATANGAS')).toHaveLength(4);
    expect(barangaysIn('CONCRETING OF ROAD IN BARANGAY STA. ANA, CALATAGAN, BATANGAS')).toEqual(['0401008023']);
    expect(barangaysIn('(COMPLETION) OF ROAD, BRGY. PARAISO-LUYA, CALATAGAN, BATANGAS')).toEqual(['0401008014', '0401008015']);
    expect(barangaysIn('IMPROVEMENT OF BARANGAY HALL, BRGY. ENCARNATION, CALATAGAN, BATANGAS')).toEqual(['0401008009']);
    expect(barangaysIn('CONSTRUCTION OF ROAD AT BARANGAY QULITISAN, CALATAGAN, BATANGAS')).toEqual(['0401008020']);
  });

  it('does not read a barangay into the road name', () => {
    expect(barangaysIn('WIDENING - NASUGBU-LIAN-CALATAGAN RD, CALATAGAN, BATANGAS')).toEqual([]);
  });
});
