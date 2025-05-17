/// <reference path="s-expression.d.ts" />

import p, { Sexp, SexpString, Token, CompoundSexp } from "s-expression";
import { makeFailure, makeOk, Result } from "./result";
import { isString, isArray, isError, isNumber, isBoolean } from "./type-predicates";
import { allT } from "./list";
import { DictEntry } from "../L32/L32-ast";
import { isSymbolSExp } from "../L32/L32-value";

// s-expression returns strings quoted as "a" as [String: 'a'] objects
// to distinguish them from symbols - which are encoded as 'a'
// These are constructed using the new String("a") constructor
// and can be distinguished from regular strings based on the constructor.
export const isSexpString = (x: any): x is SexpString =>
  !isString(x) && x.constructor && x.constructor.name === "String";

export const isToken = (x: any): x is Token => isString(x) || isSexpString(x);
export const isSexp = (x: any): x is Sexp => isToken(x) || isCompoundSexp(x);
export const isDictEntry = (x: any): x is DictEntry => (x.length === 2 && isSymbolSExp(x[0]) && (isToken(x[1]) || isNumber(x[1]) || isBoolean(x[1]))) || x.tag === "DictEntry";
export const isCompoundSexp = (x: any): x is CompoundSexp =>
  isArray(x) && allT(isSexp, x);

export const parse = (x: string): Result<Sexp> => {
  const parsed = p(x);
  return isError(parsed) ? makeFailure(parsed.message) : makeOk(parsed);
};
