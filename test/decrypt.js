export const id = x => x;
export const unbool = bool => bool(true)(false)
export const unchurch = num => num(x => x + 1)(0)
export const unpair = decode => pair => '(' + [decode(pair(a => () => a)), decode(pair(() => b => b))] + ')';
const isNilL = l => l($6 => $6 => t => f => f);
export const unlist = decoder => list => {
    let result = [];
    while(!unbool(isNilL(list))) {
        let head = list(h => t => h);
        result.push(decoder(head));
        list = list(h => t => t);
    }
    return '[' + result + ']';
}
export const unlistnat = nl => unchurch(nl(h => t => h))
export const unint = int => (unchurch(int(a => _ => a))) - (unchurch(int(_ => b => b)))
export const unrat = rat => (unint(rat(a => _ => a)))/(unint(rat(_ => b => b)))
export const uncomplex = complex => (unrat(complex(a => _ => a))) + ' + ' + (unrat(complex(_ => b => b))) + 'i'
export const unhc = decoder => hc => {
    let val;
    hc(v => { val = v });
    return decoder(val);
}
export const br = () => document.body.append(document.createElement('br')) ?? '';
export const hr = () => document.body.append(document.createElement('hr')) ?? '';