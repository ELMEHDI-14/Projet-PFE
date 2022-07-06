/*var unvs;
function f1(par) {
    var prom1 = new Promise((resolve, reject) => {
        setTimeout(() => { }, 10000)
        par = "fulfilled"
        resolve(par)
    })
    return prom1
}
function f2(par) {
    var prom1 = new Promise((resolve, reject) => {
        setTimeout(() => { }, 10000)
        resolve(par + '1')

    })
    return prom1
}

async function calls() {
    var p = ""
    var p1 =  await f1(p)
    var p2 =  await f2(p1)
    console.log(p2)

}
calls()
*/
function resolveAfter2Seconds(x) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(x);
        }, 20000);
    });
}

async function f1() {
    var x = await resolveAfter2Seconds(10);
    console.log(x);
    return x
}

async function f2() {
   
    var x1= await f1()
    let x = 3
    console.log(x1)
};
async function r(){
    unv = [3, 2, 5]
    return unv
}
async function w() {
    var arr = await r()
    console.log(arr)
}
w()