import type { LucideIcon } from "lucide-react";
import {
  ArrowUpDown,
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  CalendarRange,
  CircleDot,
  Columns3,
  DollarSign,
  Factory,
  Filter,
  Globe2,
  GraduationCap,
  Hash,
  Landmark,
  Layers,
  LayoutGrid,
  Linkedin,
  ListFilter,
  Mail,
  Map,
  MapPin,
  Network,
  Phone,
  Shield,
  ShieldCheck,
  TrendingUp,
  Type,
  User,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { HS_FILTER_SECTION_IDS } from "@/components/feature/hiring-signals/hsFilterSectionIds";

export type FilterSectionIconLookup = {
  title: string;
  filterKey?: string;
  sectionId?: string;
};

const HS_SECTION_ICONS: Record<string, LucideIcon> = {
  [HS_FILTER_SECTION_IDS.companyName]: Building2,
  [HS_FILTER_SECTION_IDS.companyCountry]: Globe2,
  [HS_FILTER_SECTION_IDS.companyIndustry]: Factory,
  [HS_FILTER_SECTION_IDS.companyEmployeeSize]: Users,
  [HS_FILTER_SECTION_IDS.companyRevenue]: DollarSign,
  [HS_FILTER_SECTION_IDS.companyFunding]: Landmark,
  [HS_FILTER_SECTION_IDS.dataQuality]: ShieldCheck,
  [HS_FILTER_SECTION_IDS.jobTitle]: Type,
  [HS_FILTER_SECTION_IDS.jobLocation]: MapPin,
  [HS_FILTER_SECTION_IDS.datePosted]: Calendar,
  [HS_FILTER_SECTION_IDS.experienceLevel]: Layers,
  [HS_FILTER_SECTION_IDS.jobType]: Briefcase,
  [HS_FILTER_SECTION_IDS.linkedinApply]: Linkedin,
  [HS_FILTER_SECTION_IDS.jobFunction]: Network,
  [HS_FILTER_SECTION_IDS.education]: GraduationCap,
  [HS_FILTER_SECTION_IDS.requiredSkills]: Wrench,
  [HS_FILTER_SECTION_IDS.compliancePreferences]: Shield,
  [HS_FILTER_SECTION_IDS.compensation]: Banknote,
};

const TITLE_ICONS: Record<string, LucideIcon> = {
  sort: ArrowUpDown,
  view: LayoutGrid,
  columns: Columns3,
  email: Mail,
  service: ListFilter,
  action: Zap,
  status: CircleDot,
  "date range": CalendarRange,
  "date posted": Calendar,
  title: Type,
  location: MapPin,
  "experience level": Layers,
  "job type": Briefcase,
  "linkedin apply": Linkedin,
  "job department": Network,
  education: GraduationCap,
  "required skills": Wrench,
  "compliance & preferences": Shield,
  compensation: Banknote,
  "company name": Building2,
  country: Globe2,
  industry: Factory,
  "employee size": Users,
  revenue: DollarSign,
  funding: Landmark,
  "data quality": ShieldCheck,
};

const FILTER_KEY_ICONS: Record<string, LucideIcon> = {
  email: Mail,
  company: Building2,
  company_name: Building2,
  company_uuid: Building2,
  industry: Factory,
  location: MapPin,
  country: Globe2,
  title: Briefcase,
  job_title: Type,
  department: Network,
  job_function: Network,
  seniority: TrendingUp,
  experience: Layers,
  experience_level: Layers,
  employees: Users,
  employees_count: Users,
  employee_size: Users,
  employee_count: Users,
  revenue: DollarSign,
  funding: Landmark,
  phone: Phone,
  linkedin: Linkedin,
  website: Globe2,
  domain: Globe2,
  city: MapPin,
  state: Map,
  zip: Hash,
  postal_code: Hash,
  first_name: User,
  last_name: User,
  name: User,
  skills: Wrench,
  skill: Wrench,
  compensation: Banknote,
  salary: Banknote,
  education: GraduationCap,
  clearance: Shield,
  apply_method: Linkedin,
  employment_type: Briefcase,
  job_type: Briefcase,
  date_posted: Calendar,
  posted_at: Calendar,
};

type KeywordRule = { test: (haystack: string) => boolean; icon: LucideIcon };

const KEYWORD_RULES: KeywordRule[] = [
  { test: (h) => h.includes("email"), icon: Mail },
  { test: (h) => h.includes("phone"), icon: Phone },
  { test: (h) => h.includes("linkedin"), icon: Linkedin },
  { test: (h) => h.includes("revenue"), icon: DollarSign },
  { test: (h) => h.includes("funding"), icon: Landmark },
  { test: (h) => h.includes("employee") || h.includes("headcount"), icon: Users },
  { test: (h) => h.includes("industry"), icon: Factory },
  { test: (h) => h.includes("company"), icon: Building2 },
  { test: (h) => h.includes("country") || h.includes("region"), icon: Globe2 },
  { test: (h) => h.includes("location") || h.includes("city"), icon: MapPin },
  { test: (h) => h.includes("state") || h.includes("province"), icon: Map },
  { test: (h) => h.includes("zip") || h.includes("postal"), icon: Hash },
  { test: (h) => h.includes("skill"), icon: Wrench },
  { test: (h) => h.includes("education") || h.includes("degree"), icon: GraduationCap },
  { test: (h) => h.includes("salary") || h.includes("compensation"), icon: Banknote },
  { test: (h) => h.includes("experience") || h.includes("seniority"), icon: Layers },
  { test: (h) => h.includes("department") || h.includes("function"), icon: Network },
  { test: (h) => h.includes("title") || h.includes("role"), icon: Type },
  { test: (h) => h.includes("date") || h.includes("posted"), icon: Calendar },
  { test: (h) => h.includes("clearance") || h.includes("compliance"), icon: Shield },
  { test: (h) => h.includes("quality"), icon: ShieldCheck },
  { test: (h) => h.includes("website") || h.includes("domain"), icon: Globe2 },
  { test: (h) => h.includes("name"), icon: User },
  { test: (h) => h.includes("job") || h.includes("employment"), icon: Briefcase },
];

function normKey(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normTitle(title: string): string {
  return title.trim().toLowerCase();
}

/** Resolve a sidebar filter section icon from section id, API filter key, or title. */
export function resolveFilterSectionIcon({
  title,
  filterKey,
  sectionId,
}: FilterSectionIconLookup): LucideIcon {
  const sid = normKey(sectionId);
  if (sid && HS_SECTION_ICONS[sid]) return HS_SECTION_ICONS[sid];

  const key = normKey(filterKey);
  if (key && FILTER_KEY_ICONS[key]) return FILTER_KEY_ICONS[key];

  const normalizedKey = key.replace(/-/g, "_");
  if (normalizedKey && FILTER_KEY_ICONS[normalizedKey]) {
    return FILTER_KEY_ICONS[normalizedKey];
  }

  const titleNorm = normTitle(title);
  if (titleNorm && TITLE_ICONS[titleNorm]) return TITLE_ICONS[titleNorm];

  const haystack = [titleNorm, key, sid.replace(/-/g, " ")].filter(Boolean).join(" ");
  for (const rule of KEYWORD_RULES) {
    if (rule.test(haystack)) return rule.icon;
  }

  return Filter;
}
