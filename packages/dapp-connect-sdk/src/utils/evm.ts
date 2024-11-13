//from     [
//         "eip155:1:0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c",
//         "eip155:43114:0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c",
//         "eip155:10:0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c"
//       ]
// to {
//    'eip155:1':['0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c'],
//    'eip155:43114':['0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c'],
//    'eip155:10':['0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c'],
//    }
export function sortAccountsByChainId(accounts:string[]){
    const transformedAccounts :Record<string, string[]> = {};
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const parts = account?.split(':');
        const prefix = parts?.[0];
        const chainId = parts?.[1];
        const address = parts?.[2];
        const key = `${prefix}:${chainId}`;
        if (!transformedAccounts[key]) {
            transformedAccounts[key] = [];
        }
        if(address){
            transformedAccounts[key].push(address);
        }
    }
    return transformedAccounts;
}