// 便利関数たち
/** `/foo?\nbar/` から `"foo?\\nbar"` をつくる */
const regExpToString = (regExp: RegExp): string =>
  regExp.toString().slice(1, -1);
/**
 * 複数の正規表現を組み合わせてひとつの正規表現にする(まとめてグループ化される(キャプチャなし))
 * - `r(/foo?\nbar/, /|/, /(baz)*\s/)` --> `/(?:foo?\nbar|(baz)*\s)/`
 */
const r = (...patterns: RegExp[]): RegExp => {
  return new RegExp(
    [
      '(?:',
      patterns.map((pattern) => regExpToString(pattern)).join(''),
      ')',
    ].join('')
  );
};
/**
 * `r()` のキャプチャあり版
 * - `rcapture(/foo?\nbar/, /|/, /(baz)*\s/)` --> `/((?:foo?\nbar|(baz)*\s))/`
 * - `r()` を使うので内側に1つグループを余計につくる(内側のはキャプチャなしなので意味はない)
 */
const rcapture = (...patterns: RegExp[]): RegExp => {
  return new RegExp(`(${regExpToString(r(...patterns))})`);
};
/**
 * 正規表現の末尾に繰り返し記号をつける
 * - `rrepeat(/foo/, '?')` --> `/foo?/`
 * - `rrepeat(/b(ar)/, '+')` --> `/b(ar)+/`
 */
const rrepeat = (pattern: RegExp, repeatStr: string): RegExp =>
  new RegExp(regExpToString(pattern) + repeatStr);

// パターンたち
const or = /|/;
/** クオート */
const q = /['"]/;
/** クオート以外の連続1個以上 */
const nqs = /[^'"]+/;
/** 空白文字の連続0個以上 */
const sp = /\s*/;
/** Perlの文の終了(セミコロンとその前の空白文字) */
const el = r(sp, /;/);
/** モジュール名(クオートないことがある(ファットカンマのときとか)) */
const moduleName = r(nqs, or, q, nqs, q);
/** onにつくphase名(クオートないことがある(ファットカンマのときとか)) */
const phase = r(nqs, or, q, nqs, q);
/** バージョンの指定(数字) */
const versionNum = /[0-9.]+/;
/** バージョンの指定(文字列( `'> 0.5.0, < 1.0.0'` のようなこともある)) */
const versionStr = r(q, nqs, q);
/** バージョンの指定(数字か文字列) */
const version = r(versionNum, or, versionStr);
/** カンマかファットカンマ(とその前後の空白文字) */
const comma = r(sp, /(?:,|=>)/, sp);
/** モジュール名だけ, またはモジュール名とバージョン指定 */
const moduleOrmoduleNameVersion = r(
  moduleName,
  rrepeat(r(comma, version), '?')
);
/** モジュールの指定の文(種類がいろいろある) */
const moduleStatements = rcapture(
  /(?:requires|author_requires|configureRequires|test_requires|conflicts|recommends)/,
  sp,
  moduleOrmoduleNameVersion,
  el
);
/** コメント文 */
const comment = /#[^\n]*(?:\n|$)/;
/** サブルーチン(中にモジュールの指定の文が0個以上入る) */
const sub = r(
  /sub\s*\{/,
  rrepeat(r(sp, r(moduleStatements, or, comment)), '*'),
  /\s*\}/
);
/** on(phaseとsubが指定されてセミコロンが続く) */
const on = r(/on/, sp, phase, comma, sub, el);
/**
 * cpanfileに対して全体を見れる正規表現
 * - 地べたの文とonがひとつずつ取れる
 */
const cpanfileRegExp = new RegExp(
  r(sp, r(moduleStatements, or, on, or, comment)),
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
