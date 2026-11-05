import { describe, expect, it } from 'vitest';
import { projectKind } from './project-kind';
import raw from '../data/generated/dpwh-projects.json';

const p = (category: string | null, description: string) => projectKind({ category, description });

describe('projectKind', () => {
  it('uses a work-type category when the description names no work', () => {
    expect(p('Flood Control and Drainage', 'CONSTRUCTION OF SOMETHING')).toBe('flood');
    expect(p('Water Provision and Storage', 'X')).toBe('water');
    expect(p('Bridges', 'X')).toBe('bridge');
    expect(p('Roads', 'X')).toBe('road');
    expect(p('Buildings and Facilities', 'X')).toBe('building');
  });

  it('reads the work, not the programme name in front of it', () => {
    const programme = 'CONVERGENCE AND SPECIAL SUPPORT PROGRAM - BASIC INFRASTRUCTURE PROGRAM (BIP) - ACCESS ROADS AND/OR BRIDGES FROM THE NATIONAL ROADS LEADING TO MAJOR/ STRATEGIC PUBLIC BUILDINGS/ FACILITIES - ';
    expect(p('GAA 2025 SSP', programme + 'CONSTRUCTION OF ROAD INCLUDING DRAINAGE STRUCTURE AT BARANGAY 3,CALATAGAN,BATANGAS')).toBe('road');
    expect(p('GAA 2025 SSP', 'CONVERGENCE & SPECIAL SUPPORT PROG - BASIC INFRA PROG (BIP) - ACCESS RDS &/OR BRS FROM THE NATIONAL RDS - CONSTRUCTION OF ROAD INCLUDING DRAINAGE STRUCTURE AT BARANGAY LUCSUHIN')).toBe('road');
    expect(p('Flood Control and Drainage', 'IMPROVEMENT OF CLOSED CANAL ALONG APACIBLE STREET, POBLACION II')).toBe('flood');
    expect(p('Bridges', 'BRIDGE PROGRAM WIDENING OF PERMANENT BRIDGES TALISAY BR. (B00051LZ) ALONG NASUGBU-LIAN-CALATAGAN RD')).toBe('bridge');
  });

  it('reads the description when the category is only a funding line', () => {
    expect(p('GAA 2025 SSP', 'CONVERGENCE AND SPECIAL SUPPORT PROGRAM - CONSTRUCTION/ REHABILITATION OF WATER SUPPLY/ SEPTAGE AND SEWERAGE')).toBe('water');
    expect(p('GAA 2025 SSP', 'BASIC INFRASTRUCTURE PROGRAM (BIP) - ACCESS ROADS AND/OR BRIDGES FROM NATIONAL ROAD')).toBe('road');
    expect(p('GAA 2025 SSP', 'MULTI-PURPOSE BUILDINGS/ FACILITIES TO SUPPORT SOCIAL SERVICES')).toBe('building');
    expect(p(null, 'CONSTRUCTION OF FLOOD MITIGATION STRUCTURE ALONG PAGSANGHAN RIVER')).toBe('flood');
  });

  it('falls back to other rather than guessing', () => {
    expect(p('Trust Funds 2024', 'PROCUREMENT OF EQUIPMENT')).toBe('other');
  });

  it('classifies most Calatagan projects as a real kind', () => {
    const projects = raw.projects.filter((x) => x.scope === 'calatagan');
    const other = projects.filter((x) => projectKind(x) === 'other');
    expect(other.length / projects.length).toBeLessThan(0.1);
  });
});
