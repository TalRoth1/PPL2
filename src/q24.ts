import {Program, makeAppExp, makeLitExp, Exp, CExp, makeDefineExp, makeProgram, makeIfExp, makeLetExp, makeProcExp, makeBinding, makeVarRef, VarRef, unparseL32} from './L32/L32-ast';
import fs from "fs";
import { parseL3 } from './L3/L3-ast';
import { isOk } from './shared/result';
import { map } from 'ramda';
import { makeCompoundSExp, makeSymbolSExp, SExpValue } from './L3/L3-value';
import { makeEmptySExp } from './L32/L32-value';
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
    return makeProgram(p);
}

export const RecReplaceDict = (exp: CExp) : CExp => 
    {
        if (exp.tag === 'LetExp')
            {
                const bindings = exp.bindings.map(b => makeBinding(b.var.var, RecReplaceDict(b.val)));
                const body = exp.body.map(e => RecReplaceDict(e));
                return makeLetExp(bindings, body);
            }
        if (exp.tag === 'ProcExp')
            {
                const body = exp.body.map(e => RecReplaceDict(e));
                return makeProcExp(exp.args, body);
            }
        if (exp.tag === 'IfExp')
            {
                const test = RecReplaceDict(exp.test);
                const then = RecReplaceDict(exp.then);
                const alt = RecReplaceDict(exp.alt);
                return makeIfExp(test, then, alt);
            }
        if (exp.tag === 'AppExp') 
            {
                if (exp.rator.tag === "DictExp" && exp.rands.length === 1 && exp.rands[0].tag === "LitExp")
                    return makeAppExp(makeVarRef("get"), [RecReplaceDict(exp.rator) as CExp, exp.rands[0] as CExp]);
                return makeAppExp(RecReplaceDict(exp.rator) as CExp, map(RecReplaceDict, exp.rands) as CExp[]);
            }
        if (exp.tag === "DictExp") {
            const name : VarRef = makeVarRef('dict');
            const VarList: SExpValue = map(pairToSExpVal, exp.pairs).reduceRight((acc, pair) => {
                return makeCompoundSExp(pair, acc);
            }, makeEmptySExp());
            const rands = makeLitExp(VarList)
            return makeAppExp(name, [rands]);
        } else {
            return exp;
        }
    }
    
export const pairToSExpVal = (pair: [string, CExp]) : SExpValue =>
    {
        return makeCompoundSExp(makeSymbolSExp(pair[0]), CexpToSexp(pair[1]));
    }

export const CexpToSexp = (exp: CExp) : SExpValue => 
    {
        if (exp.tag === 'NumExp')
        {
            return exp.val
        }
        if (exp.tag === 'StrExp')
        {
            return exp.val;
        }
        if (exp.tag === 'BoolExp')
        {
            return exp.val
        }
        if (exp.tag === 'VarRef')
        {
            return makeSymbolSExp(exp.var);
        }
        if (exp.tag === 'LitExp')
        {
            return (exp.val as SExpValue);
        }
        else
        {
            return (parseL3(`(L3 (quote ${unparseL32(exp)}))`) as any).value.exps[0].val
        }
    }
/*
Purpose: Transform L32 program to L3
Signature: L32ToL3(prog)
Type: Program -> Program
*/
export const L32toL3 = (prog : Program): Program =>{
    const q23: string = fs.readFileSync(__dirname + '/../src/q23.l3', { encoding: 'utf-8' });
    const newProg = parseL3(`(L3 ${q23})`);
        if(!isOk(newProg)) {
            throw new Error("Failed to parse L3 prelude");
        }
        const newProg1 = newProg.value as Program;
        const newProg2 = Dict2App(prog);
        return makeProgram(newProg1.exps.concat(newProg2.exps));
    }