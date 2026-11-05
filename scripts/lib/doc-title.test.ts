import { describe, expect, it } from 'vitest';
import { titleFrom } from './doc-title.mjs';

describe('titleFrom', () => {
  it.each([
    ['OFFICE-OFTHE-MUNICIPAL-AGRICULTURE.pdf', 'OFFICE OF THE MUNICIPAL AGRICULTURE'],
    ['UlatSaBayan.pdf', 'Ulat Sa Bayan'],
    ['Construction-of-Classroom-BuildingNewsroom-at-Lucsuhin-NHS-Dec-04-2018.pdf', 'Construction of Classroom Building Newsroom at Lucsuhin NHS Dec 04 2018'],
    ['Catreing-Services-at-Calatagan-Bats-Mar-272018.pdf', 'Catreing Services at Calatagan Bats Mar 27 2018'],
    ['Procurement-at-CalataganBatangas-Nov13-2018.pdf', 'Procurement at Calatagan Batangas Nov 13 2018'],
    ['Dairy-PRocessing-Center.pdf', 'Dairy Processing Center'],
    ['Rehabilitation-at-Brgy-Pob-IV-mAY-302018.pdf', 'Rehabilitation at Brgy Pob IV May 30 2018'],
    ['Supply-of-Medals-for-DepEdCalatagan-District.pdf', 'Supply of Medals for DepEd Calatagan District'],
    ['Lightning-Rod-at-MDRRMO-OpCen-Calatagan.pdf', 'Lightning Rod at MDRRMO OpCen Calatagan'],
    ['Construction-of-Water-System-Phase-III-at-Pob.II-Aug-282018.pdf', 'Construction of Water System Phase III at Pob.II Aug 28 2018'],
  ])('%s', (input, expected) => {
    expect(titleFrom(input)).toBe(expected);
  });
});
