require('dotenv').config()
const shell = require('shelljs')
const util = require('../lib/algoUtil')
const {EncodeUint, EncodeBytes} = util
const algosdk = require('algosdk')
const { describe } = require('yargs')

const server = "http://127.0.0.1"
const port = 8080

var adminAccount, receiverAccount, token, clientV2, appId

beforeEach(async () => {
  await privateTestNetSetup(appId)
  adminAccount = accounts[0]
  receiverAccount = accounts[1]

  token = await shell.cat(`devnet/Primary/algod.token`).stdout
  clientV2 = new algosdk.Algodv2(token, server, port)
  let info = await util.deploySecurityToken(clientV2, adminAccount)
  appId = info.appId

  await util.optInApp(clientV2, receiverAccount, appId)
})

test('contract admin role can be granted by contract admin', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('8')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["roles"]["ui"]).toEqual(8)

  await util.appCall(clientV2, receiverAccount, appId, appArgs, [receiverAccount.addr])
})

test('contract admin role can be revoked by contract admin', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('8')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('0')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["roles"]["ui"]).toEqual(undefined)
  
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('8')
  ]

  try {
    await util.appCall(clientV2, receiverAccount, appId, appArgs, [receiverAccount.addr])
  } catch (error) {
    expect(error.message).toEqual("Bad Request")
  }
  
  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["roles"]["ui"]).toEqual(undefined)
})

test('contract admin role can not be revoked by contract admin from themselves', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('0')
  ]

  try {
    await util.appCall(clientV2, adminAccount, appId, appArgs, [adminAccount.addr])
  } catch (error) {
    expect(error.message).toEqual("Bad Request")
  }
  
  localState = await util.readLocalState(clientV2, adminAccount, appId)
  expect(localState["roles"]["ui"]).toEqual(15)
})

test('wallets admin role can be granted by contract admin', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('1')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["roles"]["ui"]).toEqual(1)

  appArgs = [EncodeBytes("transfer restrictions"), EncodeUint('1'), EncodeUint('199'), EncodeUint('1610126036'), EncodeUint('7')]
  await util.appCall(clientV2, receiverAccount, appId, appArgs, [receiverAccount.addr])
})

test('wallets admin role can be revoked by contract admin', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('1')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('0')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  appArgs = [EncodeBytes("transfer restrictions"), EncodeUint('0'), EncodeUint('199'), EncodeUint('1610126036'), EncodeUint('7')]
  try {
    await util.appCall(clientV2, receiverAccount, appId, appArgs, [receiverAccount.addr])
  } catch (error) {
    expect(error.message).toEqual("Bad Request")
  }

  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["max balance"]).toEqual(undefined)
})

test('transfer rules admin role can be granted by contract admin', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('2')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["roles"]["ui"]).toEqual(2)

  appArgs = [EncodeBytes("transfer group"), EncodeUint('1'), EncodeUint('1'), EncodeUint('1610126036')]
  await util.appCall(clientV2, receiverAccount, appId, appArgs)
})

test('transfer rules admin role can be revoked by contract admin', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('2')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('0')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  appArgs = [EncodeBytes("transfer group"), EncodeUint('1'), EncodeUint('1'), EncodeUint('1610126036')]
  try {
    await util.appCall(clientV2, receiverAccount, appId, appArgs)
  } catch (error) {
    expect(error.message).toEqual("Bad Request")
  }

  globalState = await util.readGlobalState(clientV2, receiverAccount, appId)
  expect(globalState["rule11"]).toEqual(undefined)
})

test('assets admin role can be granted by contract admin', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('4')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["roles"]["ui"]).toEqual(4)

  appArgs = [EncodeBytes("transfer restrictions"), EncodeUint('0'), EncodeUint('199'), EncodeUint('1610126036'), EncodeUint('7')]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  appArgs = [EncodeBytes("mint"), EncodeUint('27')]
  await util.appCall(clientV2, receiverAccount, appId, appArgs, [receiverAccount.addr])
  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["balance"]["ui"]).toEqual(27)

  appArgs = [EncodeBytes("burn"), EncodeUint('27')]
  await util.appCall(clientV2, receiverAccount, appId, appArgs, [receiverAccount.addr])
  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["balance"]["ui"]).toEqual(undefined)
})

test('assets admin role can be revoked by contract admin', async () => {
  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('4')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  appArgs = [
    EncodeBytes("grantRoles"),
    EncodeUint('0')
  ]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

  appArgs = [EncodeBytes("transfer restrictions"), EncodeUint('0'), EncodeUint('199'), EncodeUint('1610126036'), EncodeUint('7')]
  await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])
  
  appArgs = [EncodeBytes("mint"), EncodeUint('27')]
  try {
    await util.appCall(clientV2, receiverAccount, appId, appArgs, [receiverAccount.addr])
  } catch (error) {
    expect(error.message).toEqual("Bad Request")
  }
  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["balance"]["ui"]).toEqual(undefined)

  appArgs = [EncodeBytes("burn"), EncodeUint('27')]
  try {
    await util.appCall(clientV2, receiverAccount, appId, appArgs, [receiverAccount.addr])
  } catch (error) {
    expect(error.message).toEqual("Bad Request")
  }
  localState = await util.readLocalState(clientV2, receiverAccount, appId)
  expect(localState["balance"]["ui"]).toEqual(undefined)
})