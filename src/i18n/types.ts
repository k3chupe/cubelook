import type { PluralForms } from "./index";

export interface TitledText {
  title: string;
  description?: string;
}

export interface CaseText {
  name?: string;
  subtitle?: string;
}

export interface Messages {
  meta: {
    /** Native language name shown in the language picker. */
    name: string;
    machineTranslated: boolean;
  };
  app: {
    tagline: string;
    description: string;
  };
  ui: {
    onlyFav: string;
    onlyFavHint: string;
    hideSlice: string;
    hideSliceHint: string;
    hideLearned: string;
    hideLearnedHint: string;
    compact: string;
    compactHint: string;
    collapseAll: string;
    expandAll: string;
    print: string;
    language: string;
    theme: string;
    themeSystem: string;
    themeLight: string;
    themeDark: string;
    learningPath: string;
    path4lll: string;
    pathFull: string;
    sortLabel: string;
    sortGroups: string;
    sortFreqDesc: string;
    sortFreqAsc: string;
    probability: string;
    sectionsNav: string;
    cases: PluralForms;
    alternatives: PluralForms;
    chooseFav: string;
    showOnlyFav: string;
    fav: string;
    setFav: string;
    moveUp: string;
    moveDown: string;
    playHere: string;
    playFav: string;
    openScdbHint: string;
    openCube: string;
    openCubeHint: string;
    openTwizzle: string;
    markLearned: string;
    rotateCase: string;
    learned: string;
    tips: string;
    legend: string;
    howto: string[];
    allLearned: string;
    reset: string;
    resetConfirm: string;
    loading3d: string;
    error3d: string;
    close: string;
    sameAsHint: string;
    basedOn: string;
    source: string;
    seeOnCube: string;
    tagRU: string;
    tagSlice: string;
    tagRotation: string;
    recommended: string;
    diagramF2L: string;
    diagramLL: string;
    footerVerified: string;
    footerMachine: string;
    sourcesTitle: string;
    sourcesIntro: string;
    sourcesUsedFor: string;
    sourcesLicense: string;
    toolsTitle: string;
    algCount: PluralForms;
  };
  triggers: Record<string, { label: string; description: string }>;
  content: {
    sections: Record<string, TitledText>;
    groups: Record<string, TitledText>;
    cases: Record<string, CaseText>;
    tips: Record<string, { title: string; body: string }>;
    notes: Record<string, string>;
    sources: Record<string, string>;
  };
}
