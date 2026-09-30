export type Scope = 'calatagan' | 'shared' | 'road' | 'elsewhere';
export function classify(project: { description: string; location?: { province?: string; region?: string } }): Scope;
export function barangaysIn(description: string): string[];
