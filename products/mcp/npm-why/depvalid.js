// Bundled unmodified (esbuild) from the npm 10.9 CLI: @npmcli/arborist 8.0.5 lib/dep-valid.js, npm-package-arg 12.0.2,
// semver 7.7.4, hosted-git-info, validate-npm-package-name, proc-log. All ISC license, (c) npm, Inc. and contributors.
// Used by engine.js to decide if an installed version satisfies a dependency spec exactly like npm.
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/constants.js"(exports2, module2) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/debug.js"(exports2, module2) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module2.exports = debug;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/re.js
var require_re = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/re.js"(exports2, module2) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports2 = module2.exports = {};
    var re = exports2.re = [];
    var safeRe = exports2.safeRe = [];
    var src = exports2.src = [];
    var safeSrc = exports2.safeSrc = [];
    var t = exports2.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports2.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports2.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports2.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/parse-options.js"(exports2, module2) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module2.exports = parseOptions;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/identifiers.js"(exports2, module2) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/classes/semver.js"(exports2, module2) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
                if (isNaN(this.prerelease[1])) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/parse.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/valid.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var valid = (version, options) => {
      const v = parse(version, options);
      return v ? v.version : null;
    };
    module2.exports = valid;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/clean.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var clean = (version, options) => {
      const s = parse(version.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module2.exports = clean;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/inc.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version, release, options, identifier, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier;
        identifier = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version instanceof SemVer ? version.version : version,
          options
        ).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module2.exports = inc;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/diff.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module2.exports = diff;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/major.js
var require_major = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/major.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module2.exports = major;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/minor.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module2.exports = minor;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/patch.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module2.exports = patch;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/prerelease.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var prerelease = (version, options) => {
      const parsed = parse(version, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module2.exports = prerelease;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/compare.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/rcompare.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module2.exports = rcompare;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/compare-loose.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module2.exports = compareLoose;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/compare-build.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module2.exports = compareBuild;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/sort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module2.exports = sort;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/rsort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module2.exports = rsort;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/gt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/lt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/eq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/neq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/gte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/lte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/cmp.js"(exports2, module2) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/coerce.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module2.exports = coerce;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/internal/lrucache.js"(exports2, module2) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module2.exports = LRUCache;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/classes/range.js
var require_range = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/classes/range.js"(exports2, module2) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/classes/comparator.js"(exports2, module2) {
    "use strict";
    var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/functions/satisfies.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module2.exports = satisfies;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/to-comparators.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module2.exports = toComparators;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/max-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module2.exports = maxSatisfying;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/min-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module2.exports = minSatisfying;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/min-version.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module2.exports = minVersion;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/valid.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module2.exports = validRange;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/outside.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version, range, hilo, options) => {
      version = new SemVer(version, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module2.exports = outside;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/gtr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var gtr = (version, range, options) => outside(version, range, ">", options);
    module2.exports = gtr;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/ltr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var ltr = (version, range, options) => outside(version, range, "<", options);
    module2.exports = ltr;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/intersects.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module2.exports = intersects;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/simplify.js"(exports2, module2) {
    "use strict";
    var satisfies = require_satisfies();
    var compare = require_compare();
    module2.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version of v) {
        const included = satisfies(version, range, options);
        if (included) {
          prev = version;
          if (!first) {
            first = version;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/ranges/subset.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !satisfies(gt.semver, String(c), options)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !satisfies(lt.semver, String(c), options)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module2.exports = subset;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/index.js
var require_semver2 = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/semver/index.js"(exports2, module2) {
    "use strict";
    var internalRe = require_re();
    var constants = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module2.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/lru-cache/dist/commonjs/index.js
var require_commonjs = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/lru-cache/dist/commonjs/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LRUCache = void 0;
    var perf = typeof performance === "object" && performance && typeof performance.now === "function" ? performance : Date;
    var warned = /* @__PURE__ */ new Set();
    var PROCESS = typeof process === "object" && !!process ? process : {};
    var emitWarning = (msg, type, code, fn) => {
      typeof PROCESS.emitWarning === "function" ? PROCESS.emitWarning(msg, type, code, fn) : console.error(`[${code}] ${type}: ${msg}`);
    };
    var AC = globalThis.AbortController;
    var AS = globalThis.AbortSignal;
    if (typeof AC === "undefined") {
      AS = class AbortSignal {
        onabort;
        _onabort = [];
        reason;
        aborted = false;
        addEventListener(_, fn) {
          this._onabort.push(fn);
        }
      };
      AC = class AbortController {
        constructor() {
          warnACPolyfill();
        }
        signal = new AS();
        abort(reason) {
          if (this.signal.aborted)
            return;
          this.signal.reason = reason;
          this.signal.aborted = true;
          for (const fn of this.signal._onabort) {
            fn(reason);
          }
          this.signal.onabort?.(reason);
        }
      };
      let printACPolyfillWarning = PROCESS.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1";
      const warnACPolyfill = () => {
        if (!printACPolyfillWarning)
          return;
        printACPolyfillWarning = false;
        emitWarning("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.", "NO_ABORT_CONTROLLER", "ENOTSUP", warnACPolyfill);
      };
    }
    var shouldWarn = (code) => !warned.has(code);
    var isPosInt = (n) => n && n === Math.floor(n) && n > 0 && isFinite(n);
    var getUintArray = (max) => !isPosInt(max) ? null : max <= Math.pow(2, 8) ? Uint8Array : max <= Math.pow(2, 16) ? Uint16Array : max <= Math.pow(2, 32) ? Uint32Array : max <= Number.MAX_SAFE_INTEGER ? ZeroArray : null;
    var ZeroArray = class extends Array {
      constructor(size) {
        super(size);
        this.fill(0);
      }
    };
    var Stack = class _Stack {
      heap;
      length;
      // private constructor
      static #constructing = false;
      static create(max) {
        const HeapCls = getUintArray(max);
        if (!HeapCls)
          return [];
        _Stack.#constructing = true;
        const s = new _Stack(max, HeapCls);
        _Stack.#constructing = false;
        return s;
      }
      constructor(max, HeapCls) {
        if (!_Stack.#constructing) {
          throw new TypeError("instantiate Stack using Stack.create(n)");
        }
        this.heap = new HeapCls(max);
        this.length = 0;
      }
      push(n) {
        this.heap[this.length++] = n;
      }
      pop() {
        return this.heap[--this.length];
      }
    };
    var LRUCache = class _LRUCache {
      // options that cannot be changed without disaster
      #max;
      #maxSize;
      #dispose;
      #disposeAfter;
      #fetchMethod;
      #memoMethod;
      /**
       * {@link LRUCache.OptionsBase.ttl}
       */
      ttl;
      /**
       * {@link LRUCache.OptionsBase.ttlResolution}
       */
      ttlResolution;
      /**
       * {@link LRUCache.OptionsBase.ttlAutopurge}
       */
      ttlAutopurge;
      /**
       * {@link LRUCache.OptionsBase.updateAgeOnGet}
       */
      updateAgeOnGet;
      /**
       * {@link LRUCache.OptionsBase.updateAgeOnHas}
       */
      updateAgeOnHas;
      /**
       * {@link LRUCache.OptionsBase.allowStale}
       */
      allowStale;
      /**
       * {@link LRUCache.OptionsBase.noDisposeOnSet}
       */
      noDisposeOnSet;
      /**
       * {@link LRUCache.OptionsBase.noUpdateTTL}
       */
      noUpdateTTL;
      /**
       * {@link LRUCache.OptionsBase.maxEntrySize}
       */
      maxEntrySize;
      /**
       * {@link LRUCache.OptionsBase.sizeCalculation}
       */
      sizeCalculation;
      /**
       * {@link LRUCache.OptionsBase.noDeleteOnFetchRejection}
       */
      noDeleteOnFetchRejection;
      /**
       * {@link LRUCache.OptionsBase.noDeleteOnStaleGet}
       */
      noDeleteOnStaleGet;
      /**
       * {@link LRUCache.OptionsBase.allowStaleOnFetchAbort}
       */
      allowStaleOnFetchAbort;
      /**
       * {@link LRUCache.OptionsBase.allowStaleOnFetchRejection}
       */
      allowStaleOnFetchRejection;
      /**
       * {@link LRUCache.OptionsBase.ignoreFetchAbort}
       */
      ignoreFetchAbort;
      // computed properties
      #size;
      #calculatedSize;
      #keyMap;
      #keyList;
      #valList;
      #next;
      #prev;
      #head;
      #tail;
      #free;
      #disposed;
      #sizes;
      #starts;
      #ttls;
      #hasDispose;
      #hasFetchMethod;
      #hasDisposeAfter;
      /**
       * Do not call this method unless you need to inspect the
       * inner workings of the cache.  If anything returned by this
       * object is modified in any way, strange breakage may occur.
       *
       * These fields are private for a reason!
       *
       * @internal
       */
      static unsafeExposeInternals(c) {
        return {
          // properties
          starts: c.#starts,
          ttls: c.#ttls,
          sizes: c.#sizes,
          keyMap: c.#keyMap,
          keyList: c.#keyList,
          valList: c.#valList,
          next: c.#next,
          prev: c.#prev,
          get head() {
            return c.#head;
          },
          get tail() {
            return c.#tail;
          },
          free: c.#free,
          // methods
          isBackgroundFetch: (p) => c.#isBackgroundFetch(p),
          backgroundFetch: (k, index, options, context) => c.#backgroundFetch(k, index, options, context),
          moveToTail: (index) => c.#moveToTail(index),
          indexes: (options) => c.#indexes(options),
          rindexes: (options) => c.#rindexes(options),
          isStale: (index) => c.#isStale(index)
        };
      }
      // Protected read-only members
      /**
       * {@link LRUCache.OptionsBase.max} (read-only)
       */
      get max() {
        return this.#max;
      }
      /**
       * {@link LRUCache.OptionsBase.maxSize} (read-only)
       */
      get maxSize() {
        return this.#maxSize;
      }
      /**
       * The total computed size of items in the cache (read-only)
       */
      get calculatedSize() {
        return this.#calculatedSize;
      }
      /**
       * The number of items stored in the cache (read-only)
       */
      get size() {
        return this.#size;
      }
      /**
       * {@link LRUCache.OptionsBase.fetchMethod} (read-only)
       */
      get fetchMethod() {
        return this.#fetchMethod;
      }
      get memoMethod() {
        return this.#memoMethod;
      }
      /**
       * {@link LRUCache.OptionsBase.dispose} (read-only)
       */
      get dispose() {
        return this.#dispose;
      }
      /**
       * {@link LRUCache.OptionsBase.disposeAfter} (read-only)
       */
      get disposeAfter() {
        return this.#disposeAfter;
      }
      constructor(options) {
        const { max = 0, ttl, ttlResolution = 1, ttlAutopurge, updateAgeOnGet, updateAgeOnHas, allowStale, dispose, disposeAfter, noDisposeOnSet, noUpdateTTL, maxSize = 0, maxEntrySize = 0, sizeCalculation, fetchMethod, memoMethod, noDeleteOnFetchRejection, noDeleteOnStaleGet, allowStaleOnFetchRejection, allowStaleOnFetchAbort, ignoreFetchAbort } = options;
        if (max !== 0 && !isPosInt(max)) {
          throw new TypeError("max option must be a nonnegative integer");
        }
        const UintArray = max ? getUintArray(max) : Array;
        if (!UintArray) {
          throw new Error("invalid max value: " + max);
        }
        this.#max = max;
        this.#maxSize = maxSize;
        this.maxEntrySize = maxEntrySize || this.#maxSize;
        this.sizeCalculation = sizeCalculation;
        if (this.sizeCalculation) {
          if (!this.#maxSize && !this.maxEntrySize) {
            throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
          }
          if (typeof this.sizeCalculation !== "function") {
            throw new TypeError("sizeCalculation set to non-function");
          }
        }
        if (memoMethod !== void 0 && typeof memoMethod !== "function") {
          throw new TypeError("memoMethod must be a function if defined");
        }
        this.#memoMethod = memoMethod;
        if (fetchMethod !== void 0 && typeof fetchMethod !== "function") {
          throw new TypeError("fetchMethod must be a function if specified");
        }
        this.#fetchMethod = fetchMethod;
        this.#hasFetchMethod = !!fetchMethod;
        this.#keyMap = /* @__PURE__ */ new Map();
        this.#keyList = new Array(max).fill(void 0);
        this.#valList = new Array(max).fill(void 0);
        this.#next = new UintArray(max);
        this.#prev = new UintArray(max);
        this.#head = 0;
        this.#tail = 0;
        this.#free = Stack.create(max);
        this.#size = 0;
        this.#calculatedSize = 0;
        if (typeof dispose === "function") {
          this.#dispose = dispose;
        }
        if (typeof disposeAfter === "function") {
          this.#disposeAfter = disposeAfter;
          this.#disposed = [];
        } else {
          this.#disposeAfter = void 0;
          this.#disposed = void 0;
        }
        this.#hasDispose = !!this.#dispose;
        this.#hasDisposeAfter = !!this.#disposeAfter;
        this.noDisposeOnSet = !!noDisposeOnSet;
        this.noUpdateTTL = !!noUpdateTTL;
        this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
        this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
        this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
        this.ignoreFetchAbort = !!ignoreFetchAbort;
        if (this.maxEntrySize !== 0) {
          if (this.#maxSize !== 0) {
            if (!isPosInt(this.#maxSize)) {
              throw new TypeError("maxSize must be a positive integer if specified");
            }
          }
          if (!isPosInt(this.maxEntrySize)) {
            throw new TypeError("maxEntrySize must be a positive integer if specified");
          }
          this.#initializeSizeTracking();
        }
        this.allowStale = !!allowStale;
        this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
        this.updateAgeOnGet = !!updateAgeOnGet;
        this.updateAgeOnHas = !!updateAgeOnHas;
        this.ttlResolution = isPosInt(ttlResolution) || ttlResolution === 0 ? ttlResolution : 1;
        this.ttlAutopurge = !!ttlAutopurge;
        this.ttl = ttl || 0;
        if (this.ttl) {
          if (!isPosInt(this.ttl)) {
            throw new TypeError("ttl must be a positive integer if specified");
          }
          this.#initializeTTLTracking();
        }
        if (this.#max === 0 && this.ttl === 0 && this.#maxSize === 0) {
          throw new TypeError("At least one of max, maxSize, or ttl is required");
        }
        if (!this.ttlAutopurge && !this.#max && !this.#maxSize) {
          const code = "LRU_CACHE_UNBOUNDED";
          if (shouldWarn(code)) {
            warned.add(code);
            const msg = "TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.";
            emitWarning(msg, "UnboundedCacheWarning", code, _LRUCache);
          }
        }
      }
      /**
       * Return the number of ms left in the item's TTL. If item is not in cache,
       * returns `0`. Returns `Infinity` if item is in cache without a defined TTL.
       */
      getRemainingTTL(key) {
        return this.#keyMap.has(key) ? Infinity : 0;
      }
      #initializeTTLTracking() {
        const ttls = new ZeroArray(this.#max);
        const starts = new ZeroArray(this.#max);
        this.#ttls = ttls;
        this.#starts = starts;
        this.#setItemTTL = (index, ttl, start = perf.now()) => {
          starts[index] = ttl !== 0 ? start : 0;
          ttls[index] = ttl;
          if (ttl !== 0 && this.ttlAutopurge) {
            const t = setTimeout(() => {
              if (this.#isStale(index)) {
                this.#delete(this.#keyList[index], "expire");
              }
            }, ttl + 1);
            if (t.unref) {
              t.unref();
            }
          }
        };
        this.#updateItemAge = (index) => {
          starts[index] = ttls[index] !== 0 ? perf.now() : 0;
        };
        this.#statusTTL = (status, index) => {
          if (ttls[index]) {
            const ttl = ttls[index];
            const start = starts[index];
            if (!ttl || !start)
              return;
            status.ttl = ttl;
            status.start = start;
            status.now = cachedNow || getNow();
            const age = status.now - start;
            status.remainingTTL = ttl - age;
          }
        };
        let cachedNow = 0;
        const getNow = () => {
          const n = perf.now();
          if (this.ttlResolution > 0) {
            cachedNow = n;
            const t = setTimeout(() => cachedNow = 0, this.ttlResolution);
            if (t.unref) {
              t.unref();
            }
          }
          return n;
        };
        this.getRemainingTTL = (key) => {
          const index = this.#keyMap.get(key);
          if (index === void 0) {
            return 0;
          }
          const ttl = ttls[index];
          const start = starts[index];
          if (!ttl || !start) {
            return Infinity;
          }
          const age = (cachedNow || getNow()) - start;
          return ttl - age;
        };
        this.#isStale = (index) => {
          const s = starts[index];
          const t = ttls[index];
          return !!t && !!s && (cachedNow || getNow()) - s > t;
        };
      }
      // conditionally set private methods related to TTL
      #updateItemAge = () => {
      };
      #statusTTL = () => {
      };
      #setItemTTL = () => {
      };
      /* c8 ignore stop */
      #isStale = () => false;
      #initializeSizeTracking() {
        const sizes = new ZeroArray(this.#max);
        this.#calculatedSize = 0;
        this.#sizes = sizes;
        this.#removeItemSize = (index) => {
          this.#calculatedSize -= sizes[index];
          sizes[index] = 0;
        };
        this.#requireSize = (k, v, size, sizeCalculation) => {
          if (this.#isBackgroundFetch(v)) {
            return 0;
          }
          if (!isPosInt(size)) {
            if (sizeCalculation) {
              if (typeof sizeCalculation !== "function") {
                throw new TypeError("sizeCalculation must be a function");
              }
              size = sizeCalculation(v, k);
              if (!isPosInt(size)) {
                throw new TypeError("sizeCalculation return invalid (expect positive integer)");
              }
            } else {
              throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
            }
          }
          return size;
        };
        this.#addItemSize = (index, size, status) => {
          sizes[index] = size;
          if (this.#maxSize) {
            const maxSize = this.#maxSize - sizes[index];
            while (this.#calculatedSize > maxSize) {
              this.#evict(true);
            }
          }
          this.#calculatedSize += sizes[index];
          if (status) {
            status.entrySize = size;
            status.totalCalculatedSize = this.#calculatedSize;
          }
        };
      }
      #removeItemSize = (_i) => {
      };
      #addItemSize = (_i, _s, _st) => {
      };
      #requireSize = (_k, _v, size, sizeCalculation) => {
        if (size || sizeCalculation) {
          throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
        }
        return 0;
      };
      *#indexes({ allowStale = this.allowStale } = {}) {
        if (this.#size) {
          for (let i = this.#tail; true; ) {
            if (!this.#isValidIndex(i)) {
              break;
            }
            if (allowStale || !this.#isStale(i)) {
              yield i;
            }
            if (i === this.#head) {
              break;
            } else {
              i = this.#prev[i];
            }
          }
        }
      }
      *#rindexes({ allowStale = this.allowStale } = {}) {
        if (this.#size) {
          for (let i = this.#head; true; ) {
            if (!this.#isValidIndex(i)) {
              break;
            }
            if (allowStale || !this.#isStale(i)) {
              yield i;
            }
            if (i === this.#tail) {
              break;
            } else {
              i = this.#next[i];
            }
          }
        }
      }
      #isValidIndex(index) {
        return index !== void 0 && this.#keyMap.get(this.#keyList[index]) === index;
      }
      /**
       * Return a generator yielding `[key, value]` pairs,
       * in order from most recently used to least recently used.
       */
      *entries() {
        for (const i of this.#indexes()) {
          if (this.#valList[i] !== void 0 && this.#keyList[i] !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
            yield [this.#keyList[i], this.#valList[i]];
          }
        }
      }
      /**
       * Inverse order version of {@link LRUCache.entries}
       *
       * Return a generator yielding `[key, value]` pairs,
       * in order from least recently used to most recently used.
       */
      *rentries() {
        for (const i of this.#rindexes()) {
          if (this.#valList[i] !== void 0 && this.#keyList[i] !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
            yield [this.#keyList[i], this.#valList[i]];
          }
        }
      }
      /**
       * Return a generator yielding the keys in the cache,
       * in order from most recently used to least recently used.
       */
      *keys() {
        for (const i of this.#indexes()) {
          const k = this.#keyList[i];
          if (k !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
            yield k;
          }
        }
      }
      /**
       * Inverse order version of {@link LRUCache.keys}
       *
       * Return a generator yielding the keys in the cache,
       * in order from least recently used to most recently used.
       */
      *rkeys() {
        for (const i of this.#rindexes()) {
          const k = this.#keyList[i];
          if (k !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
            yield k;
          }
        }
      }
      /**
       * Return a generator yielding the values in the cache,
       * in order from most recently used to least recently used.
       */
      *values() {
        for (const i of this.#indexes()) {
          const v = this.#valList[i];
          if (v !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
            yield this.#valList[i];
          }
        }
      }
      /**
       * Inverse order version of {@link LRUCache.values}
       *
       * Return a generator yielding the values in the cache,
       * in order from least recently used to most recently used.
       */
      *rvalues() {
        for (const i of this.#rindexes()) {
          const v = this.#valList[i];
          if (v !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
            yield this.#valList[i];
          }
        }
      }
      /**
       * Iterating over the cache itself yields the same results as
       * {@link LRUCache.entries}
       */
      [Symbol.iterator]() {
        return this.entries();
      }
      /**
       * A String value that is used in the creation of the default string
       * description of an object. Called by the built-in method
       * `Object.prototype.toString`.
       */
      [Symbol.toStringTag] = "LRUCache";
      /**
       * Find a value for which the supplied fn method returns a truthy value,
       * similar to `Array.find()`. fn is called as `fn(value, key, cache)`.
       */
      find(fn, getOptions = {}) {
        for (const i of this.#indexes()) {
          const v = this.#valList[i];
          const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
          if (value === void 0)
            continue;
          if (fn(value, this.#keyList[i], this)) {
            return this.get(this.#keyList[i], getOptions);
          }
        }
      }
      /**
       * Call the supplied function on each item in the cache, in order from most
       * recently used to least recently used.
       *
       * `fn` is called as `fn(value, key, cache)`.
       *
       * If `thisp` is provided, function will be called in the `this`-context of
       * the provided object, or the cache if no `thisp` object is provided.
       *
       * Does not update age or recenty of use, or iterate over stale values.
       */
      forEach(fn, thisp = this) {
        for (const i of this.#indexes()) {
          const v = this.#valList[i];
          const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
          if (value === void 0)
            continue;
          fn.call(thisp, value, this.#keyList[i], this);
        }
      }
      /**
       * The same as {@link LRUCache.forEach} but items are iterated over in
       * reverse order.  (ie, less recently used items are iterated over first.)
       */
      rforEach(fn, thisp = this) {
        for (const i of this.#rindexes()) {
          const v = this.#valList[i];
          const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
          if (value === void 0)
            continue;
          fn.call(thisp, value, this.#keyList[i], this);
        }
      }
      /**
       * Delete any stale entries. Returns true if anything was removed,
       * false otherwise.
       */
      purgeStale() {
        let deleted = false;
        for (const i of this.#rindexes({ allowStale: true })) {
          if (this.#isStale(i)) {
            this.#delete(this.#keyList[i], "expire");
            deleted = true;
          }
        }
        return deleted;
      }
      /**
       * Get the extended info about a given entry, to get its value, size, and
       * TTL info simultaneously. Returns `undefined` if the key is not present.
       *
       * Unlike {@link LRUCache#dump}, which is designed to be portable and survive
       * serialization, the `start` value is always the current timestamp, and the
       * `ttl` is a calculated remaining time to live (negative if expired).
       *
       * Always returns stale values, if their info is found in the cache, so be
       * sure to check for expirations (ie, a negative {@link LRUCache.Entry#ttl})
       * if relevant.
       */
      info(key) {
        const i = this.#keyMap.get(key);
        if (i === void 0)
          return void 0;
        const v = this.#valList[i];
        const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
        if (value === void 0)
          return void 0;
        const entry = { value };
        if (this.#ttls && this.#starts) {
          const ttl = this.#ttls[i];
          const start = this.#starts[i];
          if (ttl && start) {
            const remain = ttl - (perf.now() - start);
            entry.ttl = remain;
            entry.start = Date.now();
          }
        }
        if (this.#sizes) {
          entry.size = this.#sizes[i];
        }
        return entry;
      }
      /**
       * Return an array of [key, {@link LRUCache.Entry}] tuples which can be
       * passed to {@link LRLUCache#load}.
       *
       * The `start` fields are calculated relative to a portable `Date.now()`
       * timestamp, even if `performance.now()` is available.
       *
       * Stale entries are always included in the `dump`, even if
       * {@link LRUCache.OptionsBase.allowStale} is false.
       *
       * Note: this returns an actual array, not a generator, so it can be more
       * easily passed around.
       */
      dump() {
        const arr = [];
        for (const i of this.#indexes({ allowStale: true })) {
          const key = this.#keyList[i];
          const v = this.#valList[i];
          const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
          if (value === void 0 || key === void 0)
            continue;
          const entry = { value };
          if (this.#ttls && this.#starts) {
            entry.ttl = this.#ttls[i];
            const age = perf.now() - this.#starts[i];
            entry.start = Math.floor(Date.now() - age);
          }
          if (this.#sizes) {
            entry.size = this.#sizes[i];
          }
          arr.unshift([key, entry]);
        }
        return arr;
      }
      /**
       * Reset the cache and load in the items in entries in the order listed.
       *
       * The shape of the resulting cache may be different if the same options are
       * not used in both caches.
       *
       * The `start` fields are assumed to be calculated relative to a portable
       * `Date.now()` timestamp, even if `performance.now()` is available.
       */
      load(arr) {
        this.clear();
        for (const [key, entry] of arr) {
          if (entry.start) {
            const age = Date.now() - entry.start;
            entry.start = perf.now() - age;
          }
          this.set(key, entry.value, entry);
        }
      }
      /**
       * Add a value to the cache.
       *
       * Note: if `undefined` is specified as a value, this is an alias for
       * {@link LRUCache#delete}
       *
       * Fields on the {@link LRUCache.SetOptions} options param will override
       * their corresponding values in the constructor options for the scope
       * of this single `set()` operation.
       *
       * If `start` is provided, then that will set the effective start
       * time for the TTL calculation. Note that this must be a previous
       * value of `performance.now()` if supported, or a previous value of
       * `Date.now()` if not.
       *
       * Options object may also include `size`, which will prevent
       * calling the `sizeCalculation` function and just use the specified
       * number if it is a positive integer, and `noDisposeOnSet` which
       * will prevent calling a `dispose` function in the case of
       * overwrites.
       *
       * If the `size` (or return value of `sizeCalculation`) for a given
       * entry is greater than `maxEntrySize`, then the item will not be
       * added to the cache.
       *
       * Will update the recency of the entry.
       *
       * If the value is `undefined`, then this is an alias for
       * `cache.delete(key)`. `undefined` is never stored in the cache.
       */
      set(k, v, setOptions = {}) {
        if (v === void 0) {
          this.delete(k);
          return this;
        }
        const { ttl = this.ttl, start, noDisposeOnSet = this.noDisposeOnSet, sizeCalculation = this.sizeCalculation, status } = setOptions;
        let { noUpdateTTL = this.noUpdateTTL } = setOptions;
        const size = this.#requireSize(k, v, setOptions.size || 0, sizeCalculation);
        if (this.maxEntrySize && size > this.maxEntrySize) {
          if (status) {
            status.set = "miss";
            status.maxEntrySizeExceeded = true;
          }
          this.#delete(k, "set");
          return this;
        }
        let index = this.#size === 0 ? void 0 : this.#keyMap.get(k);
        if (index === void 0) {
          index = this.#size === 0 ? this.#tail : this.#free.length !== 0 ? this.#free.pop() : this.#size === this.#max ? this.#evict(false) : this.#size;
          this.#keyList[index] = k;
          this.#valList[index] = v;
          this.#keyMap.set(k, index);
          this.#next[this.#tail] = index;
          this.#prev[index] = this.#tail;
          this.#tail = index;
          this.#size++;
          this.#addItemSize(index, size, status);
          if (status)
            status.set = "add";
          noUpdateTTL = false;
        } else {
          this.#moveToTail(index);
          const oldVal = this.#valList[index];
          if (v !== oldVal) {
            if (this.#hasFetchMethod && this.#isBackgroundFetch(oldVal)) {
              oldVal.__abortController.abort(new Error("replaced"));
              const { __staleWhileFetching: s } = oldVal;
              if (s !== void 0 && !noDisposeOnSet) {
                if (this.#hasDispose) {
                  this.#dispose?.(s, k, "set");
                }
                if (this.#hasDisposeAfter) {
                  this.#disposed?.push([s, k, "set"]);
                }
              }
            } else if (!noDisposeOnSet) {
              if (this.#hasDispose) {
                this.#dispose?.(oldVal, k, "set");
              }
              if (this.#hasDisposeAfter) {
                this.#disposed?.push([oldVal, k, "set"]);
              }
            }
            this.#removeItemSize(index);
            this.#addItemSize(index, size, status);
            this.#valList[index] = v;
            if (status) {
              status.set = "replace";
              const oldValue = oldVal && this.#isBackgroundFetch(oldVal) ? oldVal.__staleWhileFetching : oldVal;
              if (oldValue !== void 0)
                status.oldValue = oldValue;
            }
          } else if (status) {
            status.set = "update";
          }
        }
        if (ttl !== 0 && !this.#ttls) {
          this.#initializeTTLTracking();
        }
        if (this.#ttls) {
          if (!noUpdateTTL) {
            this.#setItemTTL(index, ttl, start);
          }
          if (status)
            this.#statusTTL(status, index);
        }
        if (!noDisposeOnSet && this.#hasDisposeAfter && this.#disposed) {
          const dt = this.#disposed;
          let task;
          while (task = dt?.shift()) {
            this.#disposeAfter?.(...task);
          }
        }
        return this;
      }
      /**
       * Evict the least recently used item, returning its value or
       * `undefined` if cache is empty.
       */
      pop() {
        try {
          while (this.#size) {
            const val = this.#valList[this.#head];
            this.#evict(true);
            if (this.#isBackgroundFetch(val)) {
              if (val.__staleWhileFetching) {
                return val.__staleWhileFetching;
              }
            } else if (val !== void 0) {
              return val;
            }
          }
        } finally {
          if (this.#hasDisposeAfter && this.#disposed) {
            const dt = this.#disposed;
            let task;
            while (task = dt?.shift()) {
              this.#disposeAfter?.(...task);
            }
          }
        }
      }
      #evict(free) {
        const head = this.#head;
        const k = this.#keyList[head];
        const v = this.#valList[head];
        if (this.#hasFetchMethod && this.#isBackgroundFetch(v)) {
          v.__abortController.abort(new Error("evicted"));
        } else if (this.#hasDispose || this.#hasDisposeAfter) {
          if (this.#hasDispose) {
            this.#dispose?.(v, k, "evict");
          }
          if (this.#hasDisposeAfter) {
            this.#disposed?.push([v, k, "evict"]);
          }
        }
        this.#removeItemSize(head);
        if (free) {
          this.#keyList[head] = void 0;
          this.#valList[head] = void 0;
          this.#free.push(head);
        }
        if (this.#size === 1) {
          this.#head = this.#tail = 0;
          this.#free.length = 0;
        } else {
          this.#head = this.#next[head];
        }
        this.#keyMap.delete(k);
        this.#size--;
        return head;
      }
      /**
       * Check if a key is in the cache, without updating the recency of use.
       * Will return false if the item is stale, even though it is technically
       * in the cache.
       *
       * Check if a key is in the cache, without updating the recency of
       * use. Age is updated if {@link LRUCache.OptionsBase.updateAgeOnHas} is set
       * to `true` in either the options or the constructor.
       *
       * Will return `false` if the item is stale, even though it is technically in
       * the cache. The difference can be determined (if it matters) by using a
       * `status` argument, and inspecting the `has` field.
       *
       * Will not update item age unless
       * {@link LRUCache.OptionsBase.updateAgeOnHas} is set.
       */
      has(k, hasOptions = {}) {
        const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
        const index = this.#keyMap.get(k);
        if (index !== void 0) {
          const v = this.#valList[index];
          if (this.#isBackgroundFetch(v) && v.__staleWhileFetching === void 0) {
            return false;
          }
          if (!this.#isStale(index)) {
            if (updateAgeOnHas) {
              this.#updateItemAge(index);
            }
            if (status) {
              status.has = "hit";
              this.#statusTTL(status, index);
            }
            return true;
          } else if (status) {
            status.has = "stale";
            this.#statusTTL(status, index);
          }
        } else if (status) {
          status.has = "miss";
        }
        return false;
      }
      /**
       * Like {@link LRUCache#get} but doesn't update recency or delete stale
       * items.
       *
       * Returns `undefined` if the item is stale, unless
       * {@link LRUCache.OptionsBase.allowStale} is set.
       */
      peek(k, peekOptions = {}) {
        const { allowStale = this.allowStale } = peekOptions;
        const index = this.#keyMap.get(k);
        if (index === void 0 || !allowStale && this.#isStale(index)) {
          return;
        }
        const v = this.#valList[index];
        return this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      }
      #backgroundFetch(k, index, options, context) {
        const v = index === void 0 ? void 0 : this.#valList[index];
        if (this.#isBackgroundFetch(v)) {
          return v;
        }
        const ac = new AC();
        const { signal } = options;
        signal?.addEventListener("abort", () => ac.abort(signal.reason), {
          signal: ac.signal
        });
        const fetchOpts = {
          signal: ac.signal,
          options,
          context
        };
        const cb = (v2, updateCache = false) => {
          const { aborted } = ac.signal;
          const ignoreAbort = options.ignoreFetchAbort && v2 !== void 0;
          if (options.status) {
            if (aborted && !updateCache) {
              options.status.fetchAborted = true;
              options.status.fetchError = ac.signal.reason;
              if (ignoreAbort)
                options.status.fetchAbortIgnored = true;
            } else {
              options.status.fetchResolved = true;
            }
          }
          if (aborted && !ignoreAbort && !updateCache) {
            return fetchFail(ac.signal.reason);
          }
          const bf2 = p;
          if (this.#valList[index] === p) {
            if (v2 === void 0) {
              if (bf2.__staleWhileFetching) {
                this.#valList[index] = bf2.__staleWhileFetching;
              } else {
                this.#delete(k, "fetch");
              }
            } else {
              if (options.status)
                options.status.fetchUpdated = true;
              this.set(k, v2, fetchOpts.options);
            }
          }
          return v2;
        };
        const eb = (er) => {
          if (options.status) {
            options.status.fetchRejected = true;
            options.status.fetchError = er;
          }
          return fetchFail(er);
        };
        const fetchFail = (er) => {
          const { aborted } = ac.signal;
          const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
          const allowStale = allowStaleAborted || options.allowStaleOnFetchRejection;
          const noDelete = allowStale || options.noDeleteOnFetchRejection;
          const bf2 = p;
          if (this.#valList[index] === p) {
            const del = !noDelete || bf2.__staleWhileFetching === void 0;
            if (del) {
              this.#delete(k, "fetch");
            } else if (!allowStaleAborted) {
              this.#valList[index] = bf2.__staleWhileFetching;
            }
          }
          if (allowStale) {
            if (options.status && bf2.__staleWhileFetching !== void 0) {
              options.status.returnedStale = true;
            }
            return bf2.__staleWhileFetching;
          } else if (bf2.__returned === bf2) {
            throw er;
          }
        };
        const pcall = (res, rej) => {
          const fmp = this.#fetchMethod?.(k, v, fetchOpts);
          if (fmp && fmp instanceof Promise) {
            fmp.then((v2) => res(v2 === void 0 ? void 0 : v2), rej);
          }
          ac.signal.addEventListener("abort", () => {
            if (!options.ignoreFetchAbort || options.allowStaleOnFetchAbort) {
              res(void 0);
              if (options.allowStaleOnFetchAbort) {
                res = (v2) => cb(v2, true);
              }
            }
          });
        };
        if (options.status)
          options.status.fetchDispatched = true;
        const p = new Promise(pcall).then(cb, eb);
        const bf = Object.assign(p, {
          __abortController: ac,
          __staleWhileFetching: v,
          __returned: void 0
        });
        if (index === void 0) {
          this.set(k, bf, { ...fetchOpts.options, status: void 0 });
          index = this.#keyMap.get(k);
        } else {
          this.#valList[index] = bf;
        }
        return bf;
      }
      #isBackgroundFetch(p) {
        if (!this.#hasFetchMethod)
          return false;
        const b = p;
        return !!b && b instanceof Promise && b.hasOwnProperty("__staleWhileFetching") && b.__abortController instanceof AC;
      }
      async fetch(k, fetchOptions = {}) {
        const {
          // get options
          allowStale = this.allowStale,
          updateAgeOnGet = this.updateAgeOnGet,
          noDeleteOnStaleGet = this.noDeleteOnStaleGet,
          // set options
          ttl = this.ttl,
          noDisposeOnSet = this.noDisposeOnSet,
          size = 0,
          sizeCalculation = this.sizeCalculation,
          noUpdateTTL = this.noUpdateTTL,
          // fetch exclusive options
          noDeleteOnFetchRejection = this.noDeleteOnFetchRejection,
          allowStaleOnFetchRejection = this.allowStaleOnFetchRejection,
          ignoreFetchAbort = this.ignoreFetchAbort,
          allowStaleOnFetchAbort = this.allowStaleOnFetchAbort,
          context,
          forceRefresh = false,
          status,
          signal
        } = fetchOptions;
        if (!this.#hasFetchMethod) {
          if (status)
            status.fetch = "get";
          return this.get(k, {
            allowStale,
            updateAgeOnGet,
            noDeleteOnStaleGet,
            status
          });
        }
        const options = {
          allowStale,
          updateAgeOnGet,
          noDeleteOnStaleGet,
          ttl,
          noDisposeOnSet,
          size,
          sizeCalculation,
          noUpdateTTL,
          noDeleteOnFetchRejection,
          allowStaleOnFetchRejection,
          allowStaleOnFetchAbort,
          ignoreFetchAbort,
          status,
          signal
        };
        let index = this.#keyMap.get(k);
        if (index === void 0) {
          if (status)
            status.fetch = "miss";
          const p = this.#backgroundFetch(k, index, options, context);
          return p.__returned = p;
        } else {
          const v = this.#valList[index];
          if (this.#isBackgroundFetch(v)) {
            const stale = allowStale && v.__staleWhileFetching !== void 0;
            if (status) {
              status.fetch = "inflight";
              if (stale)
                status.returnedStale = true;
            }
            return stale ? v.__staleWhileFetching : v.__returned = v;
          }
          const isStale = this.#isStale(index);
          if (!forceRefresh && !isStale) {
            if (status)
              status.fetch = "hit";
            this.#moveToTail(index);
            if (updateAgeOnGet) {
              this.#updateItemAge(index);
            }
            if (status)
              this.#statusTTL(status, index);
            return v;
          }
          const p = this.#backgroundFetch(k, index, options, context);
          const hasStale = p.__staleWhileFetching !== void 0;
          const staleVal = hasStale && allowStale;
          if (status) {
            status.fetch = isStale ? "stale" : "refresh";
            if (staleVal && isStale)
              status.returnedStale = true;
          }
          return staleVal ? p.__staleWhileFetching : p.__returned = p;
        }
      }
      async forceFetch(k, fetchOptions = {}) {
        const v = await this.fetch(k, fetchOptions);
        if (v === void 0)
          throw new Error("fetch() returned undefined");
        return v;
      }
      memo(k, memoOptions = {}) {
        const memoMethod = this.#memoMethod;
        if (!memoMethod) {
          throw new Error("no memoMethod provided to constructor");
        }
        const { context, forceRefresh, ...options } = memoOptions;
        const v = this.get(k, options);
        if (!forceRefresh && v !== void 0)
          return v;
        const vv = memoMethod(k, v, {
          options,
          context
        });
        this.set(k, vv, options);
        return vv;
      }
      /**
       * Return a value from the cache. Will update the recency of the cache
       * entry found.
       *
       * If the key is not found, get() will return `undefined`.
       */
      get(k, getOptions = {}) {
        const { allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, status } = getOptions;
        const index = this.#keyMap.get(k);
        if (index !== void 0) {
          const value = this.#valList[index];
          const fetching = this.#isBackgroundFetch(value);
          if (status)
            this.#statusTTL(status, index);
          if (this.#isStale(index)) {
            if (status)
              status.get = "stale";
            if (!fetching) {
              if (!noDeleteOnStaleGet) {
                this.#delete(k, "expire");
              }
              if (status && allowStale)
                status.returnedStale = true;
              return allowStale ? value : void 0;
            } else {
              if (status && allowStale && value.__staleWhileFetching !== void 0) {
                status.returnedStale = true;
              }
              return allowStale ? value.__staleWhileFetching : void 0;
            }
          } else {
            if (status)
              status.get = "hit";
            if (fetching) {
              return value.__staleWhileFetching;
            }
            this.#moveToTail(index);
            if (updateAgeOnGet) {
              this.#updateItemAge(index);
            }
            return value;
          }
        } else if (status) {
          status.get = "miss";
        }
      }
      #connect(p, n) {
        this.#prev[n] = p;
        this.#next[p] = n;
      }
      #moveToTail(index) {
        if (index !== this.#tail) {
          if (index === this.#head) {
            this.#head = this.#next[index];
          } else {
            this.#connect(this.#prev[index], this.#next[index]);
          }
          this.#connect(this.#tail, index);
          this.#tail = index;
        }
      }
      /**
       * Deletes a key out of the cache.
       *
       * Returns true if the key was deleted, false otherwise.
       */
      delete(k) {
        return this.#delete(k, "delete");
      }
      #delete(k, reason) {
        let deleted = false;
        if (this.#size !== 0) {
          const index = this.#keyMap.get(k);
          if (index !== void 0) {
            deleted = true;
            if (this.#size === 1) {
              this.#clear(reason);
            } else {
              this.#removeItemSize(index);
              const v = this.#valList[index];
              if (this.#isBackgroundFetch(v)) {
                v.__abortController.abort(new Error("deleted"));
              } else if (this.#hasDispose || this.#hasDisposeAfter) {
                if (this.#hasDispose) {
                  this.#dispose?.(v, k, reason);
                }
                if (this.#hasDisposeAfter) {
                  this.#disposed?.push([v, k, reason]);
                }
              }
              this.#keyMap.delete(k);
              this.#keyList[index] = void 0;
              this.#valList[index] = void 0;
              if (index === this.#tail) {
                this.#tail = this.#prev[index];
              } else if (index === this.#head) {
                this.#head = this.#next[index];
              } else {
                const pi = this.#prev[index];
                this.#next[pi] = this.#next[index];
                const ni = this.#next[index];
                this.#prev[ni] = this.#prev[index];
              }
              this.#size--;
              this.#free.push(index);
            }
          }
        }
        if (this.#hasDisposeAfter && this.#disposed?.length) {
          const dt = this.#disposed;
          let task;
          while (task = dt?.shift()) {
            this.#disposeAfter?.(...task);
          }
        }
        return deleted;
      }
      /**
       * Clear the cache entirely, throwing away all values.
       */
      clear() {
        return this.#clear("delete");
      }
      #clear(reason) {
        for (const index of this.#rindexes({ allowStale: true })) {
          const v = this.#valList[index];
          if (this.#isBackgroundFetch(v)) {
            v.__abortController.abort(new Error("deleted"));
          } else {
            const k = this.#keyList[index];
            if (this.#hasDispose) {
              this.#dispose?.(v, k, reason);
            }
            if (this.#hasDisposeAfter) {
              this.#disposed?.push([v, k, reason]);
            }
          }
        }
        this.#keyMap.clear();
        this.#valList.fill(void 0);
        this.#keyList.fill(void 0);
        if (this.#ttls && this.#starts) {
          this.#ttls.fill(0);
          this.#starts.fill(0);
        }
        if (this.#sizes) {
          this.#sizes.fill(0);
        }
        this.#head = 0;
        this.#tail = 0;
        this.#free.length = 0;
        this.#calculatedSize = 0;
        this.#size = 0;
        if (this.#hasDisposeAfter && this.#disposed) {
          const dt = this.#disposed;
          let task;
          while (task = dt?.shift()) {
            this.#disposeAfter?.(...task);
          }
        }
      }
    };
    exports2.LRUCache = LRUCache;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/hosted-git-info/lib/hosts.js
var require_hosts = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/hosted-git-info/lib/hosts.js"(exports2, module2) {
    "use strict";
    var maybeJoin = (...args) => args.every((arg) => arg) ? args.join("") : "";
    var maybeEncode = (arg) => arg ? encodeURIComponent(arg) : "";
    var formatHashFragment = (f) => f.toLowerCase().replace(/^\W+/g, "").replace(/(?<!\W)\W+$/, "").replace(/\//g, "").replace(/\W+/g, "-");
    var defaults = {
      sshtemplate: ({ domain, user, project, committish }) => `git@${domain}:${user}/${project}.git${maybeJoin("#", committish)}`,
      sshurltemplate: ({ domain, user, project, committish }) => `git+ssh://git@${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
      edittemplate: ({ domain, user, project, committish, editpath, path }) => `https://${domain}/${user}/${project}${maybeJoin("/", editpath, "/", maybeEncode(committish || "HEAD"), "/", path)}`,
      browsetemplate: ({ domain, user, project, committish, treepath }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish))}`,
      browsetreetemplate: ({ domain, user, project, committish, treepath, path, fragment, hashformat }) => `https://${domain}/${user}/${project}/${treepath}/${maybeEncode(committish || "HEAD")}/${path}${maybeJoin("#", hashformat(fragment || ""))}`,
      browseblobtemplate: ({ domain, user, project, committish, blobpath, path, fragment, hashformat }) => `https://${domain}/${user}/${project}/${blobpath}/${maybeEncode(committish || "HEAD")}/${path}${maybeJoin("#", hashformat(fragment || ""))}`,
      docstemplate: ({ domain, user, project, treepath, committish }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish))}#readme`,
      httpstemplate: ({ auth, domain, user, project, committish }) => `git+https://${maybeJoin(auth, "@")}${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
      filetemplate: ({ domain, user, project, committish, path }) => `https://${domain}/${user}/${project}/raw/${maybeEncode(committish || "HEAD")}/${path}`,
      shortcuttemplate: ({ type, user, project, committish }) => `${type}:${user}/${project}${maybeJoin("#", committish)}`,
      pathtemplate: ({ user, project, committish }) => `${user}/${project}${maybeJoin("#", committish)}`,
      bugstemplate: ({ domain, user, project }) => `https://${domain}/${user}/${project}/issues`,
      hashformat: formatHashFragment
    };
    var hosts = {};
    hosts.github = {
      // First two are insecure and generally shouldn't be used any more, but
      // they are still supported.
      protocols: ["git:", "http:", "git+ssh:", "git+https:", "ssh:", "https:"],
      domain: "github.com",
      treepath: "tree",
      blobpath: "blob",
      editpath: "edit",
      filetemplate: ({ auth, user, project, committish, path }) => `https://${maybeJoin(auth, "@")}raw.githubusercontent.com/${user}/${project}/${maybeEncode(committish || "HEAD")}/${path}`,
      gittemplate: ({ auth, domain, user, project, committish }) => `git://${maybeJoin(auth, "@")}${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
      tarballtemplate: ({ domain, user, project, committish }) => `https://codeload.${domain}/${user}/${project}/tar.gz/${maybeEncode(committish || "HEAD")}`,
      extract: (url) => {
        let [, user, project, type, committish] = url.pathname.split("/", 5);
        if (type && type !== "tree") {
          return;
        }
        if (!type) {
          committish = url.hash.slice(1);
        }
        if (project && project.endsWith(".git")) {
          project = project.slice(0, -4);
        }
        if (!user || !project) {
          return;
        }
        return { user, project, committish };
      }
    };
    hosts.bitbucket = {
      protocols: ["git+ssh:", "git+https:", "ssh:", "https:"],
      domain: "bitbucket.org",
      treepath: "src",
      blobpath: "src",
      editpath: "?mode=edit",
      edittemplate: ({ domain, user, project, committish, treepath, path, editpath }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish || "HEAD"), "/", path, editpath)}`,
      tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}/get/${maybeEncode(committish || "HEAD")}.tar.gz`,
      extract: (url) => {
        let [, user, project, aux] = url.pathname.split("/", 4);
        if (["get"].includes(aux)) {
          return;
        }
        if (project && project.endsWith(".git")) {
          project = project.slice(0, -4);
        }
        if (!user || !project) {
          return;
        }
        return { user, project, committish: url.hash.slice(1) };
      }
    };
    hosts.gitlab = {
      protocols: ["git+ssh:", "git+https:", "ssh:", "https:"],
      domain: "gitlab.com",
      treepath: "tree",
      blobpath: "tree",
      editpath: "-/edit",
      httpstemplate: ({ auth, domain, user, project, committish }) => `git+https://${maybeJoin(auth, "@")}${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
      tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}/repository/archive.tar.gz?ref=${maybeEncode(committish || "HEAD")}`,
      extract: (url) => {
        const path = url.pathname.slice(1);
        if (path.includes("/-/") || path.includes("/archive.tar.gz")) {
          return;
        }
        const segments = path.split("/");
        let project = segments.pop();
        if (project.endsWith(".git")) {
          project = project.slice(0, -4);
        }
        const user = segments.join("/");
        if (!user || !project) {
          return;
        }
        return { user, project, committish: url.hash.slice(1) };
      }
    };
    hosts.gist = {
      protocols: ["git:", "git+ssh:", "git+https:", "ssh:", "https:"],
      domain: "gist.github.com",
      editpath: "edit",
      sshtemplate: ({ domain, project, committish }) => `git@${domain}:${project}.git${maybeJoin("#", committish)}`,
      sshurltemplate: ({ domain, project, committish }) => `git+ssh://git@${domain}/${project}.git${maybeJoin("#", committish)}`,
      edittemplate: ({ domain, user, project, committish, editpath }) => `https://${domain}/${user}/${project}${maybeJoin("/", maybeEncode(committish))}/${editpath}`,
      browsetemplate: ({ domain, project, committish }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}`,
      browsetreetemplate: ({ domain, project, committish, path, hashformat }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}${maybeJoin("#", hashformat(path))}`,
      browseblobtemplate: ({ domain, project, committish, path, hashformat }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}${maybeJoin("#", hashformat(path))}`,
      docstemplate: ({ domain, project, committish }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}`,
      httpstemplate: ({ domain, project, committish }) => `git+https://${domain}/${project}.git${maybeJoin("#", committish)}`,
      filetemplate: ({ user, project, committish, path }) => `https://gist.githubusercontent.com/${user}/${project}/raw${maybeJoin("/", maybeEncode(committish))}/${path}`,
      shortcuttemplate: ({ type, project, committish }) => `${type}:${project}${maybeJoin("#", committish)}`,
      pathtemplate: ({ project, committish }) => `${project}${maybeJoin("#", committish)}`,
      bugstemplate: ({ domain, project }) => `https://${domain}/${project}`,
      gittemplate: ({ domain, project, committish }) => `git://${domain}/${project}.git${maybeJoin("#", committish)}`,
      tarballtemplate: ({ project, committish }) => `https://codeload.github.com/gist/${project}/tar.gz/${maybeEncode(committish || "HEAD")}`,
      extract: (url) => {
        let [, user, project, aux] = url.pathname.split("/", 4);
        if (aux === "raw") {
          return;
        }
        if (!project) {
          if (!user) {
            return;
          }
          project = user;
          user = null;
        }
        if (project.endsWith(".git")) {
          project = project.slice(0, -4);
        }
        return { user, project, committish: url.hash.slice(1) };
      },
      hashformat: function(fragment) {
        return fragment && "file-" + formatHashFragment(fragment);
      }
    };
    hosts.sourcehut = {
      protocols: ["git+ssh:", "https:"],
      domain: "git.sr.ht",
      treepath: "tree",
      blobpath: "tree",
      filetemplate: ({ domain, user, project, committish, path }) => `https://${domain}/${user}/${project}/blob/${maybeEncode(committish) || "HEAD"}/${path}`,
      httpstemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
      tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}/archive/${maybeEncode(committish) || "HEAD"}.tar.gz`,
      bugstemplate: () => null,
      extract: (url) => {
        let [, user, project, aux] = url.pathname.split("/", 4);
        if (["archive"].includes(aux)) {
          return;
        }
        if (project && project.endsWith(".git")) {
          project = project.slice(0, -4);
        }
        if (!user || !project) {
          return;
        }
        return { user, project, committish: url.hash.slice(1) };
      }
    };
    for (const [name, host] of Object.entries(hosts)) {
      hosts[name] = Object.assign({}, defaults, host);
    }
    module2.exports = hosts;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/hosted-git-info/lib/parse-url.js
var require_parse_url = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/hosted-git-info/lib/parse-url.js"(exports2, module2) {
    var url = require("url");
    var lastIndexOfBefore = (str, char, beforeChar) => {
      const startPosition = str.indexOf(beforeChar);
      return str.lastIndexOf(char, startPosition > -1 ? startPosition : Infinity);
    };
    var safeUrl = (u) => {
      try {
        return new url.URL(u);
      } catch {
      }
    };
    var correctProtocol = (arg, protocols) => {
      const firstColon = arg.indexOf(":");
      const proto = arg.slice(0, firstColon + 1);
      if (Object.prototype.hasOwnProperty.call(protocols, proto)) {
        return arg;
      }
      const firstAt = arg.indexOf("@");
      if (firstAt > -1) {
        if (firstAt > firstColon) {
          return `git+ssh://${arg}`;
        } else {
          return arg;
        }
      }
      const doubleSlash = arg.indexOf("//");
      if (doubleSlash === firstColon + 1) {
        return arg;
      }
      return `${arg.slice(0, firstColon + 1)}//${arg.slice(firstColon + 1)}`;
    };
    var correctUrl = (giturl) => {
      const firstAt = lastIndexOfBefore(giturl, "@", "#");
      const lastColonBeforeHash = lastIndexOfBefore(giturl, ":", "#");
      if (lastColonBeforeHash > firstAt) {
        giturl = giturl.slice(0, lastColonBeforeHash) + "/" + giturl.slice(lastColonBeforeHash + 1);
      }
      if (lastIndexOfBefore(giturl, ":", "#") === -1 && giturl.indexOf("//") === -1) {
        giturl = `git+ssh://${giturl}`;
      }
      return giturl;
    };
    module2.exports = (giturl, protocols) => {
      const withProtocol = protocols ? correctProtocol(giturl, protocols) : giturl;
      return safeUrl(withProtocol) || safeUrl(correctUrl(withProtocol));
    };
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/hosted-git-info/lib/from-url.js
var require_from_url = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/hosted-git-info/lib/from-url.js"(exports2, module2) {
    "use strict";
    var parseUrl = require_parse_url();
    var isGitHubShorthand = (arg) => {
      const firstHash = arg.indexOf("#");
      const firstSlash = arg.indexOf("/");
      const secondSlash = arg.indexOf("/", firstSlash + 1);
      const firstColon = arg.indexOf(":");
      const firstSpace = /\s/.exec(arg);
      const firstAt = arg.indexOf("@");
      const spaceOnlyAfterHash = !firstSpace || firstHash > -1 && firstSpace.index > firstHash;
      const atOnlyAfterHash = firstAt === -1 || firstHash > -1 && firstAt > firstHash;
      const colonOnlyAfterHash = firstColon === -1 || firstHash > -1 && firstColon > firstHash;
      const secondSlashOnlyAfterHash = secondSlash === -1 || firstHash > -1 && secondSlash > firstHash;
      const hasSlash = firstSlash > 0;
      const doesNotEndWithSlash = firstHash > -1 ? arg[firstHash - 1] !== "/" : !arg.endsWith("/");
      const doesNotStartWithDot = !arg.startsWith(".");
      return spaceOnlyAfterHash && hasSlash && doesNotEndWithSlash && doesNotStartWithDot && atOnlyAfterHash && colonOnlyAfterHash && secondSlashOnlyAfterHash;
    };
    module2.exports = (giturl, opts, { gitHosts, protocols }) => {
      if (!giturl) {
        return;
      }
      const correctedUrl = isGitHubShorthand(giturl) ? `github:${giturl}` : giturl;
      const parsed = parseUrl(correctedUrl, protocols);
      if (!parsed) {
        return;
      }
      const gitHostShortcut = gitHosts.byShortcut[parsed.protocol];
      const gitHostDomain = gitHosts.byDomain[parsed.hostname.startsWith("www.") ? parsed.hostname.slice(4) : parsed.hostname];
      const gitHostName = gitHostShortcut || gitHostDomain;
      if (!gitHostName) {
        return;
      }
      const gitHostInfo = gitHosts[gitHostShortcut || gitHostDomain];
      let auth = null;
      if (protocols[parsed.protocol]?.auth && (parsed.username || parsed.password)) {
        auth = `${parsed.username}${parsed.password ? ":" + parsed.password : ""}`;
      }
      let committish = null;
      let user = null;
      let project = null;
      let defaultRepresentation = null;
      try {
        if (gitHostShortcut) {
          let pathname = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
          const firstAt = pathname.indexOf("@");
          if (firstAt > -1) {
            pathname = pathname.slice(firstAt + 1);
          }
          const lastSlash = pathname.lastIndexOf("/");
          if (lastSlash > -1) {
            user = decodeURIComponent(pathname.slice(0, lastSlash));
            if (!user) {
              user = null;
            }
            project = decodeURIComponent(pathname.slice(lastSlash + 1));
          } else {
            project = decodeURIComponent(pathname);
          }
          if (project.endsWith(".git")) {
            project = project.slice(0, -4);
          }
          if (parsed.hash) {
            committish = decodeURIComponent(parsed.hash.slice(1));
          }
          defaultRepresentation = "shortcut";
        } else {
          if (!gitHostInfo.protocols.includes(parsed.protocol)) {
            return;
          }
          const segments = gitHostInfo.extract(parsed);
          if (!segments) {
            return;
          }
          user = segments.user && decodeURIComponent(segments.user);
          project = decodeURIComponent(segments.project);
          committish = decodeURIComponent(segments.committish);
          defaultRepresentation = protocols[parsed.protocol]?.name || parsed.protocol.slice(0, -1);
        }
      } catch (err) {
        if (err instanceof URIError) {
          return;
        } else {
          throw err;
        }
      }
      return [gitHostName, user, auth, project, committish, defaultRepresentation, opts];
    };
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/hosted-git-info/lib/index.js
var require_lib = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/hosted-git-info/lib/index.js"(exports2, module2) {
    "use strict";
    var { LRUCache } = require_commonjs();
    var hosts = require_hosts();
    var fromUrl = require_from_url();
    var parseUrl = require_parse_url();
    var cache = new LRUCache({ max: 1e3 });
    function unknownHostedUrl(url) {
      try {
        const {
          protocol,
          hostname,
          pathname
        } = new URL(url);
        if (!hostname) {
          return null;
        }
        const proto = /(?:git\+)http:$/.test(protocol) ? "http:" : "https:";
        const path = pathname.replace(/\.git$/, "");
        return `${proto}//${hostname}${path}`;
      } catch {
        return null;
      }
    }
    var GitHost = class _GitHost {
      constructor(type, user, auth, project, committish, defaultRepresentation, opts = {}) {
        Object.assign(this, _GitHost.#gitHosts[type], {
          type,
          user,
          auth,
          project,
          committish,
          default: defaultRepresentation,
          opts
        });
      }
      static #gitHosts = { byShortcut: {}, byDomain: {} };
      static #protocols = {
        "git+ssh:": { name: "sshurl" },
        "ssh:": { name: "sshurl" },
        "git+https:": { name: "https", auth: true },
        "git:": { auth: true },
        "http:": { auth: true },
        "https:": { auth: true },
        "git+http:": { auth: true }
      };
      static addHost(name, host) {
        _GitHost.#gitHosts[name] = host;
        _GitHost.#gitHosts.byDomain[host.domain] = name;
        _GitHost.#gitHosts.byShortcut[`${name}:`] = name;
        _GitHost.#protocols[`${name}:`] = { name };
      }
      static fromUrl(giturl, opts) {
        if (typeof giturl !== "string") {
          return;
        }
        const key = giturl + JSON.stringify(opts || {});
        if (!cache.has(key)) {
          const hostArgs = fromUrl(giturl, opts, {
            gitHosts: _GitHost.#gitHosts,
            protocols: _GitHost.#protocols
          });
          cache.set(key, hostArgs ? new _GitHost(...hostArgs) : void 0);
        }
        return cache.get(key);
      }
      static fromManifest(manifest, opts = {}) {
        if (!manifest || typeof manifest !== "object") {
          return;
        }
        const r = manifest.repository;
        const rurl = r && (typeof r === "string" ? r : typeof r === "object" && typeof r.url === "string" ? r.url : null);
        if (!rurl) {
          throw new Error("no repository");
        }
        const info = rurl && _GitHost.fromUrl(rurl.replace(/^git\+/, ""), opts) || null;
        if (info) {
          return info;
        }
        const unk = unknownHostedUrl(rurl);
        return _GitHost.fromUrl(unk, opts) || unk;
      }
      static parseUrl(url) {
        return parseUrl(url);
      }
      #fill(template, opts) {
        if (typeof template !== "function") {
          return null;
        }
        const options = { ...this, ...this.opts, ...opts };
        if (!options.path) {
          options.path = "";
        }
        if (options.path.startsWith("/")) {
          options.path = options.path.slice(1);
        }
        if (options.noCommittish) {
          options.committish = null;
        }
        const result = template(options);
        return options.noGitPlus && result.startsWith("git+") ? result.slice(4) : result;
      }
      hash() {
        return this.committish ? `#${this.committish}` : "";
      }
      ssh(opts) {
        return this.#fill(this.sshtemplate, opts);
      }
      sshurl(opts) {
        return this.#fill(this.sshurltemplate, opts);
      }
      browse(path, ...args) {
        if (typeof path !== "string") {
          return this.#fill(this.browsetemplate, path);
        }
        if (typeof args[0] !== "string") {
          return this.#fill(this.browsetreetemplate, { ...args[0], path });
        }
        return this.#fill(this.browsetreetemplate, { ...args[1], fragment: args[0], path });
      }
      // If the path is known to be a file, then browseFile should be used. For some hosts
      // the url is the same as browse, but for others like GitHub a file can use both `/tree/`
      // and `/blob/` in the path. When using a default committish of `HEAD` then the `/tree/`
      // path will redirect to a specific commit. Using the `/blob/` path avoids this and
      // does not redirect to a different commit.
      browseFile(path, ...args) {
        if (typeof args[0] !== "string") {
          return this.#fill(this.browseblobtemplate, { ...args[0], path });
        }
        return this.#fill(this.browseblobtemplate, { ...args[1], fragment: args[0], path });
      }
      docs(opts) {
        return this.#fill(this.docstemplate, opts);
      }
      bugs(opts) {
        return this.#fill(this.bugstemplate, opts);
      }
      https(opts) {
        return this.#fill(this.httpstemplate, opts);
      }
      git(opts) {
        return this.#fill(this.gittemplate, opts);
      }
      shortcut(opts) {
        return this.#fill(this.shortcuttemplate, opts);
      }
      path(opts) {
        return this.#fill(this.pathtemplate, opts);
      }
      tarball(opts) {
        return this.#fill(this.tarballtemplate, { ...opts, noCommittish: false });
      }
      file(path, opts) {
        return this.#fill(this.filetemplate, { ...opts, path });
      }
      edit(path, opts) {
        return this.#fill(this.edittemplate, { ...opts, path });
      }
      getDefaultRepresentation() {
        return this.default;
      }
      toString(opts) {
        if (this.default && typeof this[this.default] === "function") {
          return this[this.default](opts);
        }
        return this.sshurl(opts);
      }
    };
    for (const [name, host] of Object.entries(hosts)) {
      GitHost.addHost(name, host);
    }
    module2.exports = GitHost;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/validate-npm-package-name/lib/index.js
var require_lib2 = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/validate-npm-package-name/lib/index.js"(exports2, module2) {
    "use strict";
    var { builtinModules: builtins } = require("module");
    var scopedPackagePattern = new RegExp("^(?:@([^/]+?)[/])?([^/]+?)$");
    var exclusionList = [
      "node_modules",
      "favicon.ico"
    ];
    function validate(name) {
      var warnings = [];
      var errors = [];
      if (name === null) {
        errors.push("name cannot be null");
        return done(warnings, errors);
      }
      if (name === void 0) {
        errors.push("name cannot be undefined");
        return done(warnings, errors);
      }
      if (typeof name !== "string") {
        errors.push("name must be a string");
        return done(warnings, errors);
      }
      if (!name.length) {
        errors.push("name length must be greater than zero");
      }
      if (name.startsWith(".")) {
        errors.push("name cannot start with a period");
      }
      if (name.match(/^_/)) {
        errors.push("name cannot start with an underscore");
      }
      if (name.trim() !== name) {
        errors.push("name cannot contain leading or trailing spaces");
      }
      exclusionList.forEach(function(excludedName) {
        if (name.toLowerCase() === excludedName) {
          errors.push(excludedName + " is not a valid package name");
        }
      });
      if (builtins.includes(name.toLowerCase())) {
        warnings.push(name + " is a core module name");
      }
      if (name.length > 214) {
        warnings.push("name can no longer contain more than 214 characters");
      }
      if (name.toLowerCase() !== name) {
        warnings.push("name can no longer contain capital letters");
      }
      if (/[~'!()*]/.test(name.split("/").slice(-1)[0])) {
        warnings.push(`name can no longer contain special characters ("~'!()*")`);
      }
      if (encodeURIComponent(name) !== name) {
        var nameMatch = name.match(scopedPackagePattern);
        if (nameMatch) {
          var user = nameMatch[1];
          var pkg = nameMatch[2];
          if (pkg.startsWith(".")) {
            errors.push("name cannot start with a period");
          }
          if (encodeURIComponent(user) === user && encodeURIComponent(pkg) === pkg) {
            return done(warnings, errors);
          }
        }
        errors.push("name can only contain URL-friendly characters");
      }
      return done(warnings, errors);
    }
    var done = function(warnings, errors) {
      var result = {
        validForNewPackages: errors.length === 0 && warnings.length === 0,
        validForOldPackages: errors.length === 0,
        warnings,
        errors
      };
      if (!result.warnings.length) {
        delete result.warnings;
      }
      if (!result.errors.length) {
        delete result.errors;
      }
      return result;
    };
    module2.exports = validate;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/proc-log/lib/index.js
var require_lib3 = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/proc-log/lib/index.js"(exports2, module2) {
    var META = /* @__PURE__ */ Symbol("proc-log.meta");
    module2.exports = {
      META,
      output: {
        LEVELS: [
          "standard",
          "error",
          "buffer",
          "flush"
        ],
        KEYS: {
          standard: "standard",
          error: "error",
          buffer: "buffer",
          flush: "flush"
        },
        standard: function(...args) {
          return process.emit("output", "standard", ...args);
        },
        error: function(...args) {
          return process.emit("output", "error", ...args);
        },
        buffer: function(...args) {
          return process.emit("output", "buffer", ...args);
        },
        flush: function(...args) {
          return process.emit("output", "flush", ...args);
        }
      },
      log: {
        LEVELS: [
          "notice",
          "error",
          "warn",
          "info",
          "verbose",
          "http",
          "silly",
          "timing",
          "pause",
          "resume"
        ],
        KEYS: {
          notice: "notice",
          error: "error",
          warn: "warn",
          info: "info",
          verbose: "verbose",
          http: "http",
          silly: "silly",
          timing: "timing",
          pause: "pause",
          resume: "resume"
        },
        error: function(...args) {
          return process.emit("log", "error", ...args);
        },
        notice: function(...args) {
          return process.emit("log", "notice", ...args);
        },
        warn: function(...args) {
          return process.emit("log", "warn", ...args);
        },
        info: function(...args) {
          return process.emit("log", "info", ...args);
        },
        verbose: function(...args) {
          return process.emit("log", "verbose", ...args);
        },
        http: function(...args) {
          return process.emit("log", "http", ...args);
        },
        silly: function(...args) {
          return process.emit("log", "silly", ...args);
        },
        timing: function(...args) {
          return process.emit("log", "timing", ...args);
        },
        pause: function() {
          return process.emit("log", "pause");
        },
        resume: function() {
          return process.emit("log", "resume");
        }
      },
      time: {
        LEVELS: [
          "start",
          "end"
        ],
        KEYS: {
          start: "start",
          end: "end"
        },
        start: function(name, fn) {
          process.emit("time", "start", name);
          function end() {
            return process.emit("time", "end", name);
          }
          if (typeof fn === "function") {
            const res = fn();
            if (res && res.finally) {
              return res.finally(end);
            }
            end();
            return res;
          }
          return end;
        },
        end: function(name) {
          return process.emit("time", "end", name);
        }
      },
      input: {
        LEVELS: [
          "start",
          "end",
          "read"
        ],
        KEYS: {
          start: "start",
          end: "end",
          read: "read"
        },
        start: function(fn) {
          process.emit("input", "start");
          function end() {
            return process.emit("input", "end");
          }
          if (typeof fn === "function") {
            const res = fn();
            if (res && res.finally) {
              return res.finally(end);
            }
            end();
            return res;
          }
          return end;
        },
        end: function() {
          return process.emit("input", "end");
        },
        read: function(...args) {
          let resolve, reject;
          const promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
          });
          process.emit("input", "read", resolve, reject, ...args);
          return promise;
        }
      }
    };
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/npm-package-arg/lib/npa.js
var require_npa = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/npm-package-arg/lib/npa.js"(exports2, module2) {
    "use strict";
    var isWindows = process.platform === "win32";
    var { URL: URL2 } = require("node:url");
    var path = isWindows ? require("node:path/win32") : require("node:path");
    var { homedir } = require("node:os");
    var HostedGit = require_lib();
    var semver = require_semver2();
    var validatePackageName = require_lib2();
    var { log } = require_lib3();
    var hasSlashes = isWindows ? /\\|[/]/ : /[/]/;
    var isURL = /^(?:git[+])?[a-z]+:/i;
    var isGit = /^[^@]+@[^:.]+\.[^:]+:.+$/i;
    var isFileType = /[.](?:tgz|tar.gz|tar)$/i;
    var isPortNumber = /:[0-9]+(\/|$)/i;
    var isWindowsFile = /^(?:[.]|~[/]|[/\\]|[a-zA-Z]:)/;
    var isPosixFile = /^(?:[.]|~[/]|[/]|[a-zA-Z]:)/;
    var defaultRegistry = "https://registry.npmjs.org";
    function npa(arg, where) {
      let name;
      let spec;
      if (typeof arg === "object") {
        if (arg instanceof Result && (!where || where === arg.where)) {
          return arg;
        } else if (arg.name && arg.rawSpec) {
          return npa.resolve(arg.name, arg.rawSpec, where || arg.where);
        } else {
          return npa(arg.raw, where || arg.where);
        }
      }
      const nameEndsAt = arg.indexOf("@", 1);
      const namePart = nameEndsAt > 0 ? arg.slice(0, nameEndsAt) : arg;
      if (isURL.test(arg)) {
        spec = arg;
      } else if (isGit.test(arg)) {
        spec = `git+ssh://${arg}`;
      } else if (!namePart.startsWith("@") && (hasSlashes.test(namePart) || isFileType.test(namePart))) {
        spec = arg;
      } else if (nameEndsAt > 0) {
        name = namePart;
        spec = arg.slice(nameEndsAt + 1) || "*";
      } else {
        const valid = validatePackageName(arg);
        if (valid.validForOldPackages) {
          name = arg;
          spec = "*";
        } else {
          spec = arg;
        }
      }
      return resolve(name, spec, where, arg);
    }
    function isFileSpec(spec) {
      if (!spec) {
        return false;
      }
      if (spec.toLowerCase().startsWith("file:")) {
        return true;
      }
      if (isWindows) {
        return isWindowsFile.test(spec);
      }
      return isPosixFile.test(spec);
    }
    function isAliasSpec(spec) {
      if (!spec) {
        return false;
      }
      return spec.toLowerCase().startsWith("npm:");
    }
    function resolve(name, spec, where, arg) {
      const res = new Result({
        raw: arg,
        name,
        rawSpec: spec,
        fromArgument: arg != null
      });
      if (name) {
        res.name = name;
      }
      if (!where) {
        where = process.cwd();
      }
      if (isFileSpec(spec)) {
        return fromFile(res, where);
      } else if (isAliasSpec(spec)) {
        return fromAlias(res, where);
      }
      const hosted = HostedGit.fromUrl(spec, {
        noGitPlus: true,
        noCommittish: true
      });
      if (hosted) {
        return fromHostedGit(res, hosted);
      } else if (spec && isURL.test(spec)) {
        return fromURL(res);
      } else if (spec && (hasSlashes.test(spec) || isFileType.test(spec))) {
        return fromFile(res, where);
      } else {
        return fromRegistry(res);
      }
    }
    function toPurl(arg, reg = defaultRegistry) {
      const res = npa(arg);
      if (res.type !== "version") {
        throw invalidPurlType(res.type, res.raw);
      }
      let purl = "pkg:npm/" + res.name.replace(/^@/, "%40") + "@" + res.rawSpec;
      if (reg !== defaultRegistry) {
        purl += "?repository_url=" + reg;
      }
      return purl;
    }
    function invalidPackageName(name, valid, raw) {
      const err = new Error(`Invalid package name "${name}" of package "${raw}": ${valid.errors.join("; ")}.`);
      err.code = "EINVALIDPACKAGENAME";
      return err;
    }
    function invalidTagName(name, raw) {
      const err = new Error(`Invalid tag name "${name}" of package "${raw}": Tags may not have any characters that encodeURIComponent encodes.`);
      err.code = "EINVALIDTAGNAME";
      return err;
    }
    function invalidPurlType(type, raw) {
      const err = new Error(`Invalid type "${type}" of package "${raw}": Purl can only be generated for "version" types.`);
      err.code = "EINVALIDPURLTYPE";
      return err;
    }
    var Result = class {
      constructor(opts) {
        this.type = opts.type;
        this.registry = opts.registry;
        this.where = opts.where;
        if (opts.raw == null) {
          this.raw = opts.name ? `${opts.name}@${opts.rawSpec}` : opts.rawSpec;
        } else {
          this.raw = opts.raw;
        }
        this.name = void 0;
        this.escapedName = void 0;
        this.scope = void 0;
        this.rawSpec = opts.rawSpec || "";
        this.saveSpec = opts.saveSpec;
        this.fetchSpec = opts.fetchSpec;
        if (opts.name) {
          this.setName(opts.name);
        }
        this.gitRange = opts.gitRange;
        this.gitCommittish = opts.gitCommittish;
        this.gitSubdir = opts.gitSubdir;
        this.hosted = opts.hosted;
      }
      // TODO move this to a getter/setter in a semver major
      setName(name) {
        const valid = validatePackageName(name);
        if (!valid.validForOldPackages) {
          throw invalidPackageName(name, valid, this.raw);
        }
        this.name = name;
        this.scope = name[0] === "@" ? name.slice(0, name.indexOf("/")) : void 0;
        this.escapedName = name.replace("/", "%2f");
        return this;
      }
      toString() {
        const full = [];
        if (this.name != null && this.name !== "") {
          full.push(this.name);
        }
        const spec = this.saveSpec || this.fetchSpec || this.rawSpec;
        if (spec != null && spec !== "") {
          full.push(spec);
        }
        return full.length ? full.join("@") : this.raw;
      }
      toJSON() {
        const result = Object.assign({}, this);
        delete result.hosted;
        return result;
      }
    };
    function setGitAttrs(res, committish) {
      if (!committish) {
        res.gitCommittish = null;
        return;
      }
      for (const part of committish.split("::")) {
        if (!part.includes(":")) {
          if (res.gitRange) {
            throw new Error("cannot override existing semver range with a committish");
          }
          if (res.gitCommittish) {
            throw new Error("cannot override existing committish with a second committish");
          }
          res.gitCommittish = part;
          continue;
        }
        const [name, value] = part.split(":");
        if (name === "semver") {
          if (res.gitCommittish) {
            throw new Error("cannot override existing committish with a semver range");
          }
          if (res.gitRange) {
            throw new Error("cannot override existing semver range with a second semver range");
          }
          res.gitRange = decodeURIComponent(value);
          continue;
        }
        if (name === "path") {
          if (res.gitSubdir) {
            throw new Error("cannot override existing path with a second path");
          }
          res.gitSubdir = `/${value}`;
          continue;
        }
        log.warn("npm-package-arg", `ignoring unknown key "${name}"`);
      }
    }
    var encodedPathChars = /* @__PURE__ */ new Map([
      ["\0", "%00"],
      ["	", "%09"],
      ["\n", "%0A"],
      ["\r", "%0D"],
      [" ", "%20"],
      ['"', "%22"],
      ["#", "%23"],
      ["%", "%25"],
      ["?", "%3F"],
      ["[", "%5B"],
      ["\\", isWindows ? "/" : "%5C"],
      ["]", "%5D"],
      ["^", "%5E"],
      ["|", "%7C"],
      ["~", "%7E"]
    ]);
    function pathToFileURL(str) {
      let result = "";
      for (let i = 0; i < str.length; i++) {
        result = `${result}${encodedPathChars.get(str[i]) ?? str[i]}`;
      }
      if (result.startsWith("file:")) {
        return result;
      }
      return `file:${result}`;
    }
    function fromFile(res, where) {
      res.type = isFileType.test(res.rawSpec) ? "file" : "directory";
      res.where = where;
      let rawSpec = pathToFileURL(res.rawSpec);
      if (rawSpec.startsWith("file:/")) {
        if (/^file:\/\/[^/]/.test(rawSpec)) {
          rawSpec = `file:/${rawSpec.slice(5)}`;
        }
        if (/^\/{1,3}\.\.?(\/|$)/.test(rawSpec.slice(5))) {
          rawSpec = rawSpec.replace(/^file:\/{1,3}/, "file:");
        }
      }
      let resolvedUrl;
      let specUrl;
      try {
        resolvedUrl = new URL2(rawSpec, `${pathToFileURL(path.resolve(where))}/`);
        specUrl = new URL2(rawSpec);
      } catch (originalError) {
        const er = new Error("Invalid file: URL, must comply with RFC 8089");
        throw Object.assign(er, {
          raw: res.rawSpec,
          spec: res,
          where,
          originalError
        });
      }
      let specPath = decodeURIComponent(specUrl.pathname);
      let resolvedPath = decodeURIComponent(resolvedUrl.pathname);
      if (isWindows) {
        specPath = specPath.replace(/^\/+([a-z]:\/)/i, "$1");
        resolvedPath = resolvedPath.replace(/^\/+([a-z]:\/)/i, "$1");
      }
      if (/^\/~(\/|$)/.test(specPath)) {
        res.saveSpec = `file:${specPath.substr(1)}`;
        resolvedPath = path.resolve(homedir(), specPath.substr(3));
      } else if (!path.isAbsolute(rawSpec.slice(5))) {
        res.saveSpec = `file:${path.relative(where, resolvedPath)}`;
      } else {
        res.saveSpec = `file:${path.resolve(resolvedPath)}`;
      }
      res.fetchSpec = path.resolve(where, resolvedPath);
      res.saveSpec = res.saveSpec.split("\\").join("/");
      if (res.saveSpec.startsWith("file://")) {
        res.saveSpec = `file:/${res.saveSpec.slice(7)}`;
      }
      return res;
    }
    function fromHostedGit(res, hosted) {
      res.type = "git";
      res.hosted = hosted;
      res.saveSpec = hosted.toString({ noGitPlus: false, noCommittish: false });
      res.fetchSpec = hosted.getDefaultRepresentation() === "shortcut" ? null : hosted.toString();
      setGitAttrs(res, hosted.committish);
      return res;
    }
    function unsupportedURLType(protocol, spec) {
      const err = new Error(`Unsupported URL Type "${protocol}": ${spec}`);
      err.code = "EUNSUPPORTEDPROTOCOL";
      return err;
    }
    function fromURL(res) {
      let rawSpec = res.rawSpec;
      res.saveSpec = rawSpec;
      if (rawSpec.startsWith("git+ssh:")) {
        const matched = rawSpec.match(/^git\+ssh:\/\/([^:#]+:[^#]+(?:\.git)?)(?:#(.*))?$/i);
        if (matched && !matched[1].match(isPortNumber)) {
          res.type = "git";
          setGitAttrs(res, matched[2]);
          res.fetchSpec = matched[1];
          return res;
        }
      } else if (rawSpec.startsWith("git+file://")) {
        rawSpec = rawSpec.replace(/\\/g, "/");
      }
      const parsedUrl = new URL2(rawSpec);
      switch (parsedUrl.protocol) {
        case "git:":
        case "git+http:":
        case "git+https:":
        case "git+rsync:":
        case "git+ftp:":
        case "git+file:":
        case "git+ssh:":
          res.type = "git";
          setGitAttrs(res, parsedUrl.hash.slice(1));
          if (parsedUrl.protocol === "git+file:" && /^git\+file:\/\/[a-z]:/i.test(rawSpec)) {
            res.fetchSpec = `git+file://${parsedUrl.host.toLowerCase()}:${parsedUrl.pathname}`;
          } else {
            parsedUrl.hash = "";
            res.fetchSpec = parsedUrl.toString();
          }
          if (res.fetchSpec.startsWith("git+")) {
            res.fetchSpec = res.fetchSpec.slice(4);
          }
          break;
        case "http:":
        case "https:":
          res.type = "remote";
          res.fetchSpec = res.saveSpec;
          break;
        default:
          throw unsupportedURLType(parsedUrl.protocol, rawSpec);
      }
      return res;
    }
    function fromAlias(res, where) {
      const subSpec = npa(res.rawSpec.substr(4), where);
      if (subSpec.type === "alias") {
        throw new Error("nested aliases not supported");
      }
      if (!subSpec.registry) {
        throw new Error("aliases only work for registry deps");
      }
      if (!subSpec.name) {
        throw new Error("aliases must have a name");
      }
      res.subSpec = subSpec;
      res.registry = true;
      res.type = "alias";
      res.saveSpec = null;
      res.fetchSpec = null;
      return res;
    }
    function fromRegistry(res) {
      res.registry = true;
      const spec = res.rawSpec.trim();
      res.saveSpec = null;
      res.fetchSpec = spec;
      const version = semver.valid(spec, true);
      const range = semver.validRange(spec, true);
      if (version) {
        res.type = "version";
      } else if (range) {
        res.type = "range";
      } else {
        if (encodeURIComponent(spec) !== spec) {
          throw invalidTagName(spec, res.raw);
        }
        res.type = "tag";
      }
      return res;
    }
    module2.exports = npa;
    module2.exports.resolve = resolve;
    module2.exports.toPurl = toPurl;
    module2.exports.Result = Result;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/from-path.js
var require_from_path = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/from-path.js"(exports2, module2) {
    var { dirname } = require("node:path");
    var npa = require_npa();
    var fromPath = (node, edge) => {
      if (edge && edge.overrides && edge.overrides.name === edge.name && edge.overrides.value) {
        if (node.sourceReference) {
          return node.sourceReference.root.realpath;
        }
        return node.root.realpath;
      }
      if (node.resolved) {
        const spec = npa(node.resolved);
        if (spec?.type === "file") {
          return dirname(spec.fetchSpec);
        }
      }
      return node.realpath;
    };
    module2.exports = fromPath;
  }
});

// ../../../../../../opt/node22/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/dep-valid.js
var require_dep_valid = __commonJS({
  "../../../../../../opt/node22/lib/node_modules/npm/node_modules/@npmcli/arborist/lib/dep-valid.js"(exports2, module2) {
    var semver = require_semver2();
    var npa = require_npa();
    var { relative } = require("node:path");
    var fromPath = require_from_path();
    var depValid = (child, requested, requestor) => {
      if (typeof requested === "string") {
        try {
          requested = npa.resolve(child.name, requested || "*", fromPath(requestor, requestor.edgesOut.get(child.name)));
        } catch (er2) {
          er2.dependency = child.name;
          er2.requested = requested;
          requestor.errors.push(er2);
          return false;
        }
      }
      if (!requested) {
        const er2 = new Error("Invalid dependency specifier");
        er2.dependency = child.name;
        er2.requested = requested;
        requestor.errors.push(er2);
        return false;
      }
      switch (requested.type) {
        case "range":
          if (requested.fetchSpec === "*") {
            return true;
          }
        // fallthrough
        case "version":
          return semver.satisfies(child.version, requested.fetchSpec, true);
        case "directory":
          return linkValid(child, requested, requestor);
        case "file":
          return tarballValid(child, requested, requestor);
        case "alias":
          return depValid(child, requested.subSpec, requestor);
        case "tag":
          return child.resolved && npa(child.resolved).type === "remote";
        case "remote":
          return child.resolved === requested.fetchSpec;
        case "git": {
          const resRepo = npa(child.resolved || "");
          const resHost = resRepo.hosted;
          const reqHost = requested.hosted;
          const reqCommit = /^[a-fA-F0-9]{40}$/.test(requested.gitCommittish || "");
          const nc = { noCommittish: !reqCommit };
          if (!resHost) {
            if (resRepo.fetchSpec !== requested.fetchSpec) {
              return false;
            }
          } else {
            if (reqHost?.ssh(nc) !== resHost.ssh(nc)) {
              return false;
            }
          }
          if (!requested.gitRange) {
            return true;
          }
          return semver.satisfies(child.package.version, requested.gitRange, {
            loose: true
          });
        }
        default:
          break;
      }
      const er = new Error("Unsupported dependency type");
      er.dependency = child.name;
      er.requested = requested;
      requestor.errors.push(er);
      return false;
    };
    var linkValid = (child, requested, requestor) => {
      const isLink = !!child.isLink;
      if (requestor.installLinks && !child.isWorkspace) {
        return !isLink;
      }
      return isLink && relative(child.realpath, requested.fetchSpec) === "";
    };
    var tarballValid = (child, requested) => {
      if (child.isLink) {
        return false;
      }
      if (child.resolved) {
        return child.resolved.replace(/\\/g, "/") === `file:${requested.fetchSpec.replace(/\\/g, "/")}`;
      }
      if (child.package._requested) {
        return child.package._requested.saveSpec === requested.saveSpec;
      }
      return false;
    };
    module2.exports = (child, requested, accept, requestor) => depValid(child, requested, requestor) || (typeof accept === "string" ? depValid(child, accept, requestor) : false);
  }
});

// entry.js
module.exports = { depValid: require_dep_valid(), npa: require_npa(), semver: require_semver2() };
