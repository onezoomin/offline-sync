import FS from '@isomorphic-git/lightning-fs'
import { diffLines } from 'diff'
import diff from 'diff-lines'
import git from 'isomorphic-git'
import stringify from 'json-stable-stringify'
import { styledConsoleLog } from '../Utils/js-utils'
const fs = new FS('testfs')

const crudEx = { // {milliseconds_userid: {EVENT_TYPE: {Event:Data} } },
  '86400000_0x000': { C: { Event: 'Data' } },
  '85400000_0x000': { R: { Event: 'Data' } },
  '84400000_0x000': { U: { Event: 'Original Data' } },
  '83400000_0x000': { D: { Event: 'Data' } },
}

export async function gitInit () {
  await git.init({ fs, dir: '/DailyEvents' })

  await fs.promises.writeFile('/DailyEvents/22_123.json', stringify(crudEx, { space: 2 }))
  await git.add({ fs, dir: '/DailyEvents', filepath: '22_123.json' })
  const sha = await git.commit({
    fs,
    dir: '/DailyEvents',
    author: {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
    },
    message: 'Added the 22_123.json file',
  })
  console.log(sha, crudEx)
  crudEx['84400000_0x000'].U.Event = 'Changed Data'
  await fs.promises.writeFile('/DailyEvents/22_123.json', stringify(crudEx, { space: 2 }))

  const status = await git.status({ fs, dir: '/DailyEvents', filepath: '22_123.json' })
  console.log(status)

  await git.add({ fs, dir: '/DailyEvents', filepath: '22_123.json' })
  const sha2 = await git.commit({
    fs,
    dir: '/DailyEvents',
    author: {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
    },
    message: 'Changed the 22_123.json file',
  })
  console.log(sha2, await getFileStateChanges(sha, sha2, '/DailyEvents'))

  const commits = await git.log({
    fs,
    dir: '/DailyEvents',
    depth: 4,
  })

  console.log(commits)

  const blob = Buffer.from((await git.readBlob({
    fs,
    dir: '/DailyEvents',
    oid: commits[0].oid,
    filepath: '22_123.json',
  })).blob).toString('utf8')
  const blob2 = Buffer.from((await git.readBlob({
    fs,
    dir: '/DailyEvents',
    oid: commits[1].oid,
    filepath: '22_123.json',
  })).blob).toString('utf8')

  console.log(blob, blob2)
  console.log(diffLines(blob, blob2))
  let sylyableDiff = diff(blob, blob2).replace(/^-(.*)$/mg, '<span style="background-color:rgba(150,0,0,0.5)">-$1</span>')
  sylyableDiff = sylyableDiff.replace(/^\+(.*)$/mg, '<span style="background-color:rgba(0,150,0,0.5)">+$1</span>')
  styledConsoleLog(sylyableDiff)
}

async function getFileStateChanges (commitHash1, commitHash2, dir) {
  return await git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: commitHash1 }), git.TREE({ ref: commitHash2 })],
    async map (filepath, [A, B]) {
      // ignore directories
      if (filepath === '.') {
        return
      }
      if ((await A.type()) === 'tree' || (await B.type()) === 'tree') {
        return
      }

      // generate ids
      const Aoid = await A.oid()
      const Boid = await B.oid()

      // determine modification type
      let type = 'equal'
      if (Aoid !== Boid) {
        type = 'modify'
      }
      if (Aoid === undefined) {
        type = 'add'
      }
      if (Boid === undefined) {
        type = 'remove'
      }
      if (Aoid === undefined && Boid === undefined) {
        console.log('Something weird happened:')
        console.log(A)
        console.log(B)
      }

      return {
        path: `/${filepath}`,
        type,
      }
    },
  })
}
