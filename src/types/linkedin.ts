/**
 * UI rows for LinkedIn search results (mapped from `ContactWithRelations` /
 * `CompanyWithRelations`).
 */

export interface LinkedInProfileRow {
  id: string;
  fullName: string;
  title: string;
  company: string;
  location: string;
  linkedinUrl: string;
  connectionDegree: number;
  importedAt: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface LinkedInCompanyRow {
  id: string;
  name: string;
  linkedinUrl: string;
}
