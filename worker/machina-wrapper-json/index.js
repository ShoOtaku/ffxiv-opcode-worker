const readCsv = require('../../lib/read-csv')
const fs = require('fs-extra')
const { join, dirname } = require('path')

const workspace = process.argv[2]
const version = process.argv[3]

const text = fs.readFileSync(join(__dirname, '../../cn-opcodes.csv'), 'utf-8')
const table = readCsv(text, null, { header: 0, skip: 1 })

const output = {}
const existsOpcode = new Set()
for (let { Name: name, Scope: scope, TeamCraft: altname, [version]: opcode } of table) {
  if (!name || !opcode) {
    continue
  }

  if (!output[scope]) {
    output[scope] = []
  }

  if (altname.includes('!')) {
    continue
  }

  if (existsOpcode.has(opcode)) {
    throw new Error(`Detected duplicate opcode ${opcode}`)
  }

  output[scope].push({
    name: altname || name,
    opcode
  })
}

const scopes = ['ServerLobbyIpc', 'ClientLobbyIpc', 'ServerZoneIpc', 'ClientZoneIpc', 'ServerChatIpc', 'ClientChatIpc']
const tab = `    `

const opcodeFile = join(workspace, 'FFXIVOpcodes/Ipcs_cn.cs')
const constantFile = join(workspace, 'FFXIVConstants/CN.cs')

fs.mkdirpSync(dirname(opcodeFile))
fs.mkdirpSync(dirname(constantFile))

fs.writeFileSync(opcodeFile, `// Generated by https://github.com/zhyupe/ffxiv-opcode-worker

namespace FFXIVOpcodes.CN
{
${scopes.map(key => `${tab}enum ${key}Type : ushort
${tab}{
${(output[key] || []).sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, opcode }) => `${tab}${tab}${name} = ${opcode},`).join('\n')
}
${tab}};`).join('\n\n')}
}
`)

fs.writeFileSync(constantFile, `// Generated by https://github.com/zhyupe/ffxiv-opcode-worker
using System.Collections.Generic;

namespace FFXIVConstants
{
${tab}static class CN
${tab}{
${tab}${tab}public static Dictionary<string, object> Constants = new Dictionary<string, object>
${tab}${tab}{
${tab}${tab}${tab}{ "InventoryOperationBaseValue", 0x01B8 },
${tab}${tab}};
${tab}}
}
`)
