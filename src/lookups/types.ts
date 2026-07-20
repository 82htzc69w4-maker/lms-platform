export const LOOKUP_LISTS = [
  'departments',
  'courseCategories',
  'jobTitles',
  'languages',
  'occupations',
] as const;

export type LookupListName = (typeof LOOKUP_LISTS)[number];

export const LOOKUP_LABELS: Record<LookupListName, string> = {
  departments: 'Departments',
  courseCategories: 'Course Categories',
  jobTitles: 'Job Titles',
  languages: 'Languages',
  occupations: 'Occupations',
};
