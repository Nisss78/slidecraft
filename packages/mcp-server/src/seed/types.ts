export interface SeedSection {
  title: string;
  html: string;
}

export interface SeedDocument {
  title: string;
  description: string;
  sections: SeedSection[];
}
