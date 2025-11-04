// export function parse(rawWorkflow){
//     const str = String(rawWorkflow ?? "");
//     const envRegex = /\$env\[(.+?)\]/g;

//     return str.replace(envRegex, (match, varName){

//         const value = process.env[varName];
//         return value === undefined ? ' ': String(value);
//     })
// }




// // what this does ? :
// // if my raw-workflow is : "My key is $env[some_var]"
// // and in my system i have some_var = 1234, then after parsing it will give : My key is 1234

