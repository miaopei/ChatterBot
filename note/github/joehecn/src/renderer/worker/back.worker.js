
/**
 * backWorker
 * -- 操作 db data
 * 
 *
 *
 */

import db from './db.js'
import data from './data.js'

let Uin = ''

const methods = {

  // value = { Type, (Content || file), tos: { premd5: failCount } }
  async sendmsg(value) {
    // db
    // { key: { Type, (Content || file), tos: { premd5: failCount } } }
    const key = (+new Date() + Math.random().toFixed(3)).replace('.', '')

    await db('setItem', {
      name: Uin,
      storeName: 'msg',
      key,
      value
    })

    // robot
    /*
    msgItem: {
      key,
      Type,
      Content, || file, buf
      toList: [{
        premd5,
        ToUserName,
        failCount
      }]
    }
    */
    const { Type, Content, file, tos } = value
    const toList = data.getToList(tos)

    const msgItem = {
      key,
      Type,
      toList
    }

    if (Type === 1) {
      msgItem.Content = Content
    } else {
      msgItem.file = {
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModifiedDate.toGMTString(),
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type
      }
      msgItem.buf = await data.getBuf(file)
    }

    postMessage({ key: 'sendmsg', value: msgItem })
  },

  async getUser (value) {
    Uin = value
  },

  async getMemberlist (value) {
    data.addChatListAndRepeatList(value) // list
    const count = data.getChatListCount()
    postMessage({ key: 'getMemberlistBack', value: count })
  },

  async getMemberlistEnded () {
    const repeatNameList = data.getRepeatNameList()
    postMessage({ key: 'getMemberlistEndedBack', value: repeatNameList })
  },

  async batchlist (value) {
    data.addChatListAndRepeatList(value)
    const count = data.getChatListCount()
    postMessage({ key: 'batchlistBack', value: count })
  },

  async startSendmsg (value) {
    const { premd5, Type } = value
    const toNickName = data.getNickName(premd5)
    postMessage({
      key: 'startSendmsgBack',
      value: {
        sending: 2,
        toNickName,
        msgType: Type
      }
    })
  },

  async sendmsgBack (value) {
    let msg = await db('getItem', {
      name: Uin,
      storeName: 'msg',
      key: value.key
    })
  
    let sending = 3
    if (value.failCount === 0) {
      // 说明消息发送成功
      sending = 1
      delete msg.tos[value.premd5]
    } else {
      msg.tos[value.premd5] = value.failCount
    }
  
    await db('setItem', {
      name: Uin,
      storeName: 'msg',
      key: value.key,
      value: msg
    })
  
    const toNickName = data.getNickName(value.premd5)
    postMessage({
      key: 'sendmsgBackBack',
      value: {
        leftMsgCount: value.leftMsgCount,
        sending,
        toNickName,
        msgType: value.Msg.Type
      }
    })
  },

  //////////////////
  // group
  async getGroupList() {
    const groupList = await db('getGroupList', Uin)
    postMessage({
      key: 'getGroupListBack',
      value: groupList
    })
  },
  async addGroup({ md5, groupName }) {
    await db('setItem', {
      name: Uin,
      storeName: 'group',
      key: md5,
      value: {
        groupName,
        tos: {}
      }
    })
    postMessage({
      key: 'addGroupBack',
      value: { md5, groupName }
    })
  },
  async delGroup({ index, md5 }) {
    await db('delGroup', { Uin, md5 })
    postMessage({
      key: 'delGroupBack',
      value: index
    })
  },
  async getGroup({ md5 }) {
    // const group = await db('getGroup', { Uin, md5 })
    const group = await db('getItem', {
      name: Uin,
      storeName: 'group',
      key: md5
    })
    const {listM, listB } = data.getListMB(group)
    postMessage({
      key: 'getGroupBack',
      value: {listM, listB }
    })
  },
  async changeStatus({ md5, item, category }) {
    const group = data.setCurGroup(item)
    // await db('setGroup', { Uin, md5, group })
    await db('setItem', {
      name: Uin,
      storeName: 'group',
      key: md5,
      value: group
    })
    postMessage({
      key: 'changeStatusBack',
      value: { premd5: item.premd5, status: item.status, category }
    })
  }
}

// 后台: 前台 -> 后台
onmessage = event => {
  methods[event.data.key] && methods[event.data.key](event.data.value)
    .catch(err => {
      postMessage({
        key: 'onerror',
        value: {
          status: err.status || 999,
          message: err.message || '未处理错误'
        }
      })
    })
}
