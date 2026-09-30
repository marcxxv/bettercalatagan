import { describe, expect, it } from 'vitest';
import { dpwhHeadline, dpwhTitle } from './dpwh-text';

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

describe('dpwhHeadline', () => {
  it('leads with the work, keeping the programme apart', () => {
    const { headline, programme } = dpwhHeadline(
      'CONVERGENCE AND SPECIAL SUPPORT PROGRAM - BASIC INFRASTRUCTURE PROGRAM (BIP) - MULTI-PURPOSE BUILDINGS/ FACILITIES TO SUPPORT SOCIAL SERVICES - CONSTRUCTION OF MULTI-PURPOSE BUILDING IN BARANGAY SAMBUNGAN, CALATAGAN, BATANGAS',
    );
    expect(headline).toBe('Construction of Multi-Purpose Building in Barangay Sambungan, Calatagan, Batangas');
    expect(programme).toMatch(/^Convergence and Special Support Program/);
  });
  it('drops trailing coordinates and splits unspaced programme dashes', () => {
    expect(dpwhHeadline('CSSP-SIPAG-MULTI-PURPOSE BUILDINGS-CONSTRUCTION OF MULTI-PURPOSE (BARANGAY HALL), BARANGAY LUCSUHIN, CALATAGAN, BATANGAS (13.878715, 120.640891)').headline).toBe(
      'Construction of Multi-Purpose (Barangay Hall), Barangay Lucsuhin, Calatagan, Batangas',
    );
  });
  it('keeps kilometre ranges with their road, and plain descriptions whole', () => {
    expect(dpwhHeadline('ROAD WIDENING - SECONDARY ROADS - NASUGBU-LIAN-CALATAGAN RD - K0100 + 500 - K0101 + 244').headline).toMatch(/^Nasugbu-Lian-Calatagan Rd/);
    expect(dpwhHeadline('CONSTRUCTION OF WATER SYSTEM, BRGY. TALISAY, CALATAGAN, BATANGAS').programme).toBeNull();
  });
});
