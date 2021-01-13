require('dotenv').config()
const shell = require('shelljs')
const util = require('../lib/algoUtil')
const {EncodeUint, EncodeBytes} = util
const algosdk = require('algosdk')

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

    //opt in
    await util.optInApp(clientV2, receiverAccount, appId)
})

test('admin can set transfer restrictions', async () => {
    // call
    appArgs = [EncodeBytes("transfer restrictions"), EncodeUint('1'), EncodeUint('199'), EncodeUint('1610126036'), EncodeUint('7')]
    await util.appCall(clientV2, adminAccount, appId, appArgs, [receiverAccount.addr])

    // account transfer restrictions has been updated
    localState = await util.readLocalState(clientV2, receiverAccount, appId)
    expect(localState["frozen"]["ui"]).toEqual(1)
    expect(localState["max balance"]["ui"]).toEqual(199)
    expect(localState["lock until"]["ui"]).toEqual(1610126036)
    expect(localState["transfer group"]["ui"]).toEqual(7)
})