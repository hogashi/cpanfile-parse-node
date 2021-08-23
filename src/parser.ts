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
 * 正規表現に名前付きキャプチャつける
 * - `rname(/foo/, 'hoge')` --> `/(?<hoge>foo)/`
 * - キャプチャの名前が被ってしまうのでsuffixに数字つける
 */
let rnameCount = 1;
const rname = (pattern: RegExp, name: string, nameSuffix?: string): RegExp =>
  new RegExp(
    `(?<${name}${nameSuffix ?? rnameCount++}>${regExpToString(pattern)})`
  );
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
const moduleName = () => rname(r(nqs, or, q, nqs, q), 'moduleName');
/** onにつくphase名(クオートないことがある(ファットカンマのときとか)) */
const phase = r(nqs, or, q, nqs, q);
/** バージョンの指定(数字) */
const versionNum = /[0-9.]+/;
/** バージョンの指定(文字列( `'> 0.5.0, < 1.0.0'` のようなこともある)) */
const versionStr = r(q, nqs, q);
/** バージョンの指定(数字か文字列) */
const version = () => rname(r(versionNum, or, versionStr), 'version');
/** カンマかファットカンマ(とその前後の空白文字) */
const comma = r(sp, /(?:,|=>)/, sp);
/** モジュール名だけ, またはモジュール名とバージョン指定 */
const moduleNameOrModuleNameVersion = () =>
  rname(
    r(moduleName(), rrepeat(r(comma, version()), '?')),
    'moduleNameOrModuleNameVersion'
  );
/** モジュールの指定の文(種類がいろいろある) */
const moduleStatement = () =>
  rname(
    r(
      /(?:requires|author_requires|configureRequires|test_requires|conflicts|recommends)/,
      sp,
      moduleNameOrModuleNameVersion(),
      el
    ),
    'moduleStatement'
  );
/** コメント文 */
const comment = /#[^\n]*(?:\n|$)/;
/** サブルーチン(中にモジュールの指定の文が0個以上入る) */
const sub = () =>
  r(
    /sub\s*\{/,
    rname(rrepeat(r(sp, r(moduleStatement(), or, comment)), '*'), 'subInner'),
    /\s*\}/
  );
/** on(phaseとsubが指定されてセミコロンが続く) */
const on = () => rname(r(/on/, sp, phase, comma, sub(), el), 'on');
/**
 * cpanfileに対して全体を見れる正規表現
 * - 地べたの文とonがひとつずつ取れる
 */
const cpanfileRegExp = new RegExp(
  r(sp, r(moduleStatement(), or, on(), or, comment)),
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
    return [...this.file.matchAll(new RegExp(cpanfileRegExp, 'g'))].map(
      (moduleStatementOrOnOrCommentMatch) => {
        console.log({ moduleStatementOrOnOrCommentMatch });
        const moduleStatementOrOnOrCommentGroups =
          moduleStatementOrOnOrCommentMatch.groups;
        if (!moduleStatementOrOnOrCommentGroups) {
          return null;
        }
        const moduleStatementOrOnOrCommentKeys = Object.keys(
          moduleStatementOrOnOrCommentGroups
        );
        const moduleStatementValues = moduleStatementOrOnOrCommentKeys
          .filter((key) => /moduleStatement[0-9]/.test(key))
          .map((key) => moduleStatementOrOnOrCommentGroups[key]);
        const onValues = moduleStatementOrOnOrCommentKeys
          .filter((key) => /on[0-9]/.test(key))
          .map((key) => moduleStatementOrOnOrCommentGroups[key]);

        moduleStatementValues.map(moduleStatementValue => {
          [...moduleStatementValue.matchAll(new RegExp(moduleNameOrModuleNameVersion(), 'g'))].map((moduleNameOrModuleNameVersionMatch) => {
              const moduleNameOrModuleNameVersionGroups =
              moduleNameOrModuleNameVersionMatch.groups;
              if (!moduleNameOrModuleNameVersionGroups) {
                return null;
              }
              const moduleNameOrModuleNameVersionKeys = Object.keys(
                moduleNameOrModuleNameVersionGroups
              );
              const moduleNameValues = moduleNameOrModuleNameVersionKeys
                .filter((key) => /moduleName[0-9]/.test(key))
                .map((key) => moduleNameOrModuleNameVersionGroups[key]);
              const versionValues = moduleNameOrModuleNameVersionKeys
                .filter((key) => /version[0-9]/.test(key))
                .map((key) => moduleNameOrModuleNameVersionGroups[key]);
            });
        });
          .matchAll(new RegExp(r(moduleStatement(), or, on()), 'g'))
          .map((statementOrOn) => {
            const statementOrOnGroups = statementOrOn.groups ?? {};
            return Object.values(groups)
              .filter((v) => v)
              .map((value) => {
                const groups = value.match(
                  moduleNameOrModuleNameVersion()
                )?.groups;
                console.log({ groups });
                if (!groups) {
                  return null;
                }
                const keys = Object.keys(groups);
                const moduleNameKey = keys.find((key) =>
                  /moduleName[0-9]+/.test(key)
                );
                const versionKey = keys.find((key) =>
                  /version[0-9]+/.test(key)
                );
                if (!moduleNameKey) {
                  return null;
                }
                return {
                  moduleName: groups[moduleNameKey],
                  // バージョン指定ないときは0にフォールバックする
                  version: versionKey ? groups[versionKey] : '0',
                };
              });
          });
      }
    );
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

export const parse = (str: string): any => {
  const env = new Env(str);

  return env.parse();
};
