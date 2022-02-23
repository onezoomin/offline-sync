import { Wallet } from '@ethersproject/wallet'
export const userWallet = Wallet.createRandom()
export const userAddress = userWallet.address
console.log('Wallet for this session =', userAddress, userWallet._mnemonic)
