// Departments offered at BUBT. Kept as a flat list so the dropdown stays simple;
// "Other" reveals a free-text field for anything not listed.
export const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Civil Engineering",
  "Textile Engineering",
  "Architecture",
  "Business Administration (BBA/MBA)",
  "Economics",
  "English",
  "Law",
  "Sociology",
  "Islamic Studies",
  "Other",
];

// Common research interest tags, used as one-click suggestions in the tag input.
// The list merges with whatever tags already exist in the database (fetched from
// /api/users/meta/tags), so it grows organically as more researchers join.
export const SUGGESTED_INTERESTS = [
  "machine learning",
  "artificial intelligence",
  "natural language processing",
  "computer vision",
  "data science",
  "cybersecurity",
  "bioinformatics",
  "robotics",
  "iot",
  "blockchain",
  "renewable energy",
  "public health",
  "software engineering",
  "cloud computing",
  "human-computer interaction",
  "computational biology",
  "structural engineering",
  "textile technology",
  "business analytics",
  "economics research",
];

// Common skill tags, used as one-click suggestions in the tag input.
export const SUGGESTED_SKILLS = [
  "python",
  "javascript",
  "java",
  "c++",
  "r",
  "matlab",
  "sql",
  "data analysis",
  "pytorch",
  "tensorflow",
  "opencv",
  "aws",
  "docker",
  "latex",
  "statistics",
  "survey design",
  "project management",
  "technical writing",
  "excel",
  "spss",
];
