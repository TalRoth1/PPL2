import { pair } from 'ramda';
import { makeProgram} from './L3/L3-ast';
import {makeDottedPair, Program, makeAppExp, makeStrExp, makeLitExp, Exp, CExp, makeDefineExp} from './L32/L32-ast';
import { Sexp } from 's-expression';
/*
Purpose: rewrite all occurrences of DictExp in a program to AppExp.
Signature: Dict2App (exp)
Type: Program -> Program
*/
export const Dict2App  = (exp: Program) : Program =>{
    const p : Exp[] = exp.exps.map(e => {
        if(e.tag === 'DefineExp') {
            return makeDefineExp(e.var, RecReplaceDict(e.val));
        }
        else{
            return RecReplaceDict(e);
        }});
    return {
        tag: 'Program',
        exps: p
    }; 
}

export const RecReplaceDict = (exp: CExp) : CExp => 
    {
        if (exp.tag === 'AppExp') 
            {
                const rator = RecReplaceDict(exp.rator);
                const rands = exp.rands.map(e => RecReplaceDict(e));
                return makeAppExp(rator, rands);
            }
        if (exp.tag === 'DictValue') {
            const name = makeStrExp('dict');
            return makeAppExp(name, exp.val.map(v => {
                const key : Sexp = v.key.val;
                const value : Sexp = v.val.toString();
                const p = [key, value]; 
                const dot = makeDottedPair(p);
                const pair = (dot.tag === "Ok") ? dot.value : dot.message;
                return makeLitExp(pair);
            }));
        } else {
            return exp;
        }
    }
/*
Purpose: Transform L32 program to L3
Signature: L32ToL3(prog)
Type: Program -> Program
*/
export const L32toL3 = (prog : Program): Program =>
    {
        const p = Dict2App(prog);
        return p;
    }