const regExpToString = (regExp: RegExp): string =>
  regExp.toString().slice(1, -1);
const r = (...patterns: RegExp[]): RegExp => {
  return new RegExp(
    [
      '(',
      patterns.map((pattern) => regExpToString(pattern)).join(''),
      ')',
    ].join('')
  );
};
/** rrepeat(/a/, '+') => /a+/ */
const rrepeat = (pattern: RegExp, repeatStr: string): RegExp =>
  new RegExp(regExpToString(pattern) + repeatStr);

// regexp patterns
const or = /|/;
const q = /['"]/;
const nqs = /[^'"]+/;
const sp = /\s*/;
const el = r(sp, /;/, sp);
const moduleName = r(nqs, or, q, nqs, q);
const phase = r(nqs, or, q, nqs, q);
const versionNum = /[0-9.]+/;
const versionStr = r(q, nqs, q);
const version = r(versionNum, or, versionStr);
const comma = r(sp, /(?:,|=>)/, sp);
const moduleNameVersion = r(moduleName, comma, version);
const moduleOrmoduleNameVersion = r(moduleName, or, moduleNameVersion);
const makeModuleStatement = (name: string) =>
  r(sp, new RegExp(name), sp, moduleOrmoduleNameVersion, el);
const requires = makeModuleStatement('requires');
const author_requires = makeModuleStatement('author_requires');
const configureRequires = makeModuleStatement('configureRequires');
const test_requires = makeModuleStatement('test_requires');
const conflicts = makeModuleStatement('conflicts');
const recommends = makeModuleStatement('recommends');
const moduleStatements = r(
  requires,
  or,
  author_requires,
  or,
  configureRequires,
  or,
  test_requires,
  or,
  conflicts,
  or,
  recommends
);
const comment = r(sp, /#[^\n]+\n/);
const sub = r(
  sp,
  /sub\s*\{/,
  rrepeat(r(sp, r(moduleStatements, or, comment), sp), '*'),
  /\}/,
  el
);
const on = r(sp, /on/, sp, phase, comma, sub, el);
const cpanfileRegExp = new RegExp(
  r(moduleStatements, or, on, or, comment),
  'g'
);

class Env {
  public file: string;
  public phase: string;
  public feature: null;
  public features: {};
  public prereqs: Prereqs;
  public mirrors: [];

  constructor(file: string) {
    this.file = file;
    this.phase = 'runtime'; // default phase
    this.feature = null;
    this.features = {};
    this.prereqs = new Prereqs();
    this.mirrors = [];
  }

  parse() {
    return [...this.file.matchAll(cpanfileRegExp)];
  }
}

class Prereqs {
  public prereqs: [];
  public features: [];

  constructor() {
    this.prereqs = [];
    this.features = [];
  }
}

export const parse: (str: string) => any = (str) => {
  const env = new Env(str);

  return env.parse();
};
