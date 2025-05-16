import { Exp, Program } from './L3/L3-ast';
import { Result, makeFailure, makeOk} from './shared/result';

/*
Purpose: Transform L2 AST to JavaScript program string
Signature: l2ToJS(l2AST)
Type: [EXP | Program] => Result<string>
*/

export const l2ToJS = (exp: Exp | Program): Result<string>  => {
    if (exp.tag === "NumExp")
        {
            return makeOk(`${exp.val}`);
        }
    if (exp.tag === "BoolExp")
        {
            return makeOk(`${exp.val}`);
        }
    if (exp.tag === "StrExp")
        {
            return makeOk(`${exp.val}`);
        }
    if (exp.tag === "VarRef")
        {
            return makeOk(`${exp.var}`);
        }
    if (exp.tag === "LitExp")
        {
            return makeOk(`${exp.val}`);
        }
    if (exp.tag === "IfExp")
        {
            const ifExp = l2ToJS(exp.test);
            const ifVal = ifExp.tag === "Ok" ? ifExp.value : ifExp.message;
            const thenExp = l2ToJS(exp.then);
            const thenVal = thenExp.tag === "Ok" ? thenExp.value : thenExp.message;
            const altExp = l2ToJS(exp.alt);
            const altVal = altExp.tag === "Ok" ? altExp.value : altExp.message;
            return makeOk(`(${ifVal} ? ${thenVal} : ${altVal})`);
        }
    if (exp.tag === "ProcExp")
        {
            const body = exp.body.map(b => l2ToJS(b));
            const bodyVal = body.map(b => b.tag === "Ok" ? b.value : b.message);
            return makeOk(`((${exp.args.map(arg => arg.var).join(",")}) => ${bodyVal})`);
        }
    if (exp.tag === "AppExp")
        {
            if (exp.rator.tag === "PrimOp")
                {
                    let op = exp.rator.op;
                    if (op === "=" || op === "eq?")
                        op = "===";
                    if (op === "not")
                        op = "!";
                    const ResRands = exp.rands.map(rand => l2ToJS(rand));
                    const rands = ResRands.map(res => {
                        if (res.tag === "Ok")
                            {
                                return res.value;
                            }
                        else
                            {
                                return res.message;
                            }});
                    if (op === "!")
                        return makeOk(`(${op}${rands})`);
                    return makeOk(`(${rands.join(` ${op} `)})`);
                }
            else if (exp.rator.tag === "VarRef")
                {
                    const rator = l2ToJS(exp.rator);
                    const rands = exp.rands.map(rand => l2ToJS(rand));
                    const ratorVal = rator.tag === "Ok" ? rator.value : rator.message;
                    const randsVal = rands.map(r => r.tag === "Ok" ? r.value : r.message);
                    return makeOk(`${ratorVal}(${randsVal.join(",")})`);
                }
            else if (exp.rator.tag === "ProcExp")
                {
                    const rator = l2ToJS(exp.rator);
                    const ratorVal = rator.tag === "Ok" ? rator.value : rator.message;
                    const rands = exp.rands.map(rand => l2ToJS(rand));
                    const randsVal = rands.map(r => r.tag === "Ok" ? r.value : r.message);
                    return makeOk(`${ratorVal}(${randsVal.join(",")})`);
                }
            else
                {
                    return makeFailure(`Unknown rator type: ${exp.rator.tag}`);
                }
        }
    if (exp.tag === "LetExp")
        {
            const bindings = exp.bindings.map(binding => {
                const val = l2ToJS(binding.val);
                const varName = binding.var;
                return { var: varName, val: val.tag === "Ok" ? val.value : val.message };
            });
            const body = exp.body.map(b => l2ToJS(b));
            const bodyVal = body.map(b => b.tag === "Ok" ? b.value : b.message);
            return makeOk(`const ${bindings} ${bodyVal}`);
        }
    if (exp.tag === "DefineExp")
        {
            const val = l2ToJS(exp.val);
            const value = val.tag === "Ok" ? val.value : val.message;
            return makeOk(`const ${exp.var.var} = ${value}`);
        }
    if (exp.tag === "Program")
        {
            const body = exp.exps.map(b => l2ToJS(b));
            const bodyVal = body.map(b => b.tag === "Ok" ? b.value : b.message);
            return makeOk(bodyVal.join(";\n"));
        }
    else
    {
        return makeFailure(`Unknown expression type: ${exp.tag}`);
    }
    }