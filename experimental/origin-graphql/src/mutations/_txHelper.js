import pubsub from '../utils/pubsub'
import contracts from '../contracts'

export async function checkMetaMask(from) {
  if (contracts.metaMask && contracts.metaMaskEnabled) {
    const net = await contracts.web3.eth.net.getId()
    const mmNet = await contracts.metaMask.eth.net.getId()
    if (net !== mmNet) {
      throw new Error(`MetaMask is not on network ${net}`)
    }
    const mmAccount = await contracts.metaMask.eth.getAccounts()
    if (!mmAccount || mmAccount[0] !== from) {
      throw new Error(`MetaMask is not set to account ${from}`)
    }
  }
}

export default function txHelper({ tx, mutation, onConfirmation, onReceipt }) {
  return new Promise((resolve, reject) => {
    let txHash
    tx.once('transactionHash', hash => {
      txHash = hash
      resolve({ id: hash })
      pubsub.publish('TRANSACTION_UPDATED', {
        transactionUpdated: {
          id: hash,
          status: 'pending',
          mutation
        }
      })
    })
      .once('receipt', receipt => {
        if (onReceipt) {
          onReceipt(receipt)
        }
        pubsub.publish('TRANSACTION_UPDATED', {
          transactionUpdated: {
            id: receipt.transactionHash,
            status: 'receipt',
            mutation
          }
        })
        if (contracts.automine) {
          setTimeout(() => {
            contracts.web3Exec.currentProvider.send(
              { method: 'evm_mine' },
              () => {}
            )
          }, contracts.automine)
        }
      })
      .on('confirmation', function(confNumber, receipt) {
        if (confNumber === 1 && onConfirmation) {
          onConfirmation(receipt)
        }
        if (confNumber > 0) {
          pubsub.publish('TRANSACTION_UPDATED', {
            transactionUpdated: {
              id: receipt.transactionHash,
              status: 'confirmed',
              mutation,
              confirmations: confNumber
            }
          })
        }
      })
      .on('error', function(err) {
        if (txHash) {
          pubsub.publish('TRANSACTION_UPDATED', {
            transactionUpdated: {
              id: txHash,
              status: 'error',
              error: err,
              mutation
            }
          })
        }
      })
      .catch(reject)
  })
}
