export type PageHeadingInfo = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
};

export type PageInspection = {
  requestedUrl: string;
  finalUrl: string;
  fetchedAt: string;
  status: number;
  redirectCount: number;
  contentType: string;
  title: string;
  metaDescription: string;
  canonical: string;
  metaRobots: string;
  googlebotRobots: string;
  xRobotsTag: string;
  lang: string;
  charset: string;
  viewport: string;
  h1s: string[];
  headings: PageHeadingInfo[];
  headingCounts: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', number>;
  bodyTextChars: number;
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: string;
    url: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  structuredData: {
    types: string[];
    blocks: number;
    invalidBlocks: number;
  };
  links: {
    total: number;
    internal: number;
    external: number;
    nofollow: number;
  };
  images: {
    total: number;
    missingAlt: number;
    emptyAlt: number;
    lazyLoaded: number;
  };
};
