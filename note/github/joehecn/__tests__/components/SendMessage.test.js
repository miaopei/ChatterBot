
import { Button, Input } from 'element-ui'
import { mount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import { cloneDeep } from 'lodash'
import storeConfig from '@/store/store-config.js'
import SendMessage from '@/components/SendMessage.vue'

describe('components/SendMessage.vue', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.component(Button.name, Button)
  localVue.component(Input.name, Input)

  const createStore = cloneStoreConfig => {
    return new Vuex.Store(cloneStoreConfig)
  }

  const $$worker = {
    postMessage: jest.fn()
  }

  const $notify = {
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn()
  }

  const createStoreAndWrapper = addList => {
    const cloneStoreConfig = cloneDeep(storeConfig)
    if (addList) {
      cloneStoreConfig.state.listM = [{
        premd5: 'premd', status: 1, category: 'M',
        NickName: 'joe', RemarkName: 'he'
      }]
    }
    const store = createStore(cloneStoreConfig)
    const wrapper = mount(SendMessage, {
      mocks: { $$worker, $notify },
      store,
      localVue,
      sync: false
    })

    return { store, wrapper }
  }

  test('sendTextMsgs 不能发送空消息', () => {
    expect.assertions(1)

    const { wrapper } = createStoreAndWrapper(false)
    wrapper.find('#send-text-btn').trigger('click')

    expect($notify.warning)
      .toHaveBeenCalledWith({
        message: '不能发送空消息',
        position: 'bottom-left',
        title: '警告'
      })
  })

  test('sendTextMsgs 请先选择要发送给哪些人或群', () => {
    expect.assertions(1)

    const { wrapper } = createStoreAndWrapper(false)
    wrapper.vm.textMessage = 'test'
    wrapper.find('#send-text-btn').trigger('click')

    expect($notify.warning)
      .toHaveBeenCalledWith({
        message: '请先选择要发送给哪些人或群',
        position: 'bottom-left',
        title: '警告'
      })
  })

  test('sendTextMsgs success', async () => {
    expect.assertions(1)

    const { wrapper } = createStoreAndWrapper(true)

    wrapper.vm.textMessage = 'test'
    wrapper.find('#send-text-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect($$worker.postMessage)
      .toHaveBeenCalledWith({
        key: 'sendmsg',
        value: {
          Type: 1,
          Content: 'test',
          tos: { 'premd': 0 }
        }
      })
  })

  test('sending', async () => {
    expect.assertions(4)

    const { store, wrapper } = createStoreAndWrapper(false)
    store.commit('setSendMsgReport', {
      sending: 2,
      toNickName: 'joe',
      msgType: 1
    })

    await wrapper.vm.$nextTick()

    expect($notify.info)
      .toHaveBeenCalledWith({
        message: '给 joe 发送 文本 消息中...',
        position: 'bottom-left',
        title: '发送消息'
      })

    store.commit('setSendMsgReport', {
      sending: 1,
      toNickName: 'joe',
      msgType: 1
    })

    await wrapper.vm.$nextTick()

    expect($notify.success)
      .toHaveBeenCalledWith({
        message: '给 joe 发送 文本 消息成功',
        position: 'bottom-left',
        title: '发送成功'
      })
    
    store.commit('setSendMsgReport', {
      sending: 3,
      toNickName: 'joe',
      msgType: 1
    })

    await wrapper.vm.$nextTick()

    expect($notify.error)
      .toHaveBeenCalledWith({
        message: '给 joe 发送 文本 消息失败',
        position: 'bottom-left',
        title: '发送失败'
      })
    
    store.commit('setSendMsgReport', {
      sending: 2,
      toNickName: 'joe',
      msgType: 3
    })

    await wrapper.vm.$nextTick()

    expect($notify.info)
      .toHaveBeenCalledWith({
        message: '给 joe 发送 图片 消息中...',
        position: 'bottom-left',
        title: '发送消息'
      })
  })

  test('sendImgMsgs 请先选择要发送给哪些人或群', () => {
    expect.assertions(1)

    const { wrapper } = createStoreAndWrapper(false)
    wrapper.find('#send-img-btn').trigger('click')
    
    expect($notify.warning)
      .toHaveBeenCalledWith({
        message: '请先选择要发送给哪些人或群',
        position: 'bottom-left',
        title: '警告'
      })
  })

  test('sendImgMsgs success', () => {
    expect.assertions(1)

    const { wrapper } = createStoreAndWrapper(true)
    wrapper.find('#send-img-btn').trigger('click')
    
    expect(wrapper.vm.$refs.imgFiles.value).toBe('')
  })

  test('file change 限制图片不能大于 512KB', () => {
    expect.assertions(1)

    const { wrapper } = createStoreAndWrapper(false)
    const file = { size: 524288 + 1 }
    Object.defineProperty(wrapper.vm.$refs.imgFiles, 'files', {
      value: [ file ]
    })
    wrapper.find('#sendImgInput').trigger('change')

    expect($notify.warning)
      .toHaveBeenCalledWith({
        message: '限制图片不能大于 512KB',
        position: 'bottom-left',
        title: '警告'
      })
  })

  test('file change 现在只写了发送 jpeg、png 图片的逻辑', () => {
    expect.assertions(1)

    const { wrapper } = createStoreAndWrapper(false)
    const file = new File(["foo"], "foo.txt", {
      type: "text/plain"
    })
    Object.defineProperty(wrapper.vm.$refs.imgFiles, 'files', {
      value: [ file ]
    })
    wrapper.find('#sendImgInput').trigger('change')

    expect($notify.warning)
      .toHaveBeenCalledWith({
        message: '现在只写了发送 jpeg、png 图片的逻辑',
        position: 'bottom-left',
        title: '警告'
      })
  })

  test('file change success', () => {
    expect.assertions(1)

    const { wrapper } = createStoreAndWrapper(true)
    const file = { size: 524288, type: 'image/jpeg' }
    Object.defineProperty(wrapper.vm.$refs.imgFiles, 'files', {
      value: [ file ]
    })
    wrapper.find('#sendImgInput').trigger('change')

    expect($$worker.postMessage)
      .toHaveBeenCalledWith({
        key: 'sendmsg',
        value: {
          Type: 3,
          file,
          tos: { premd: 0 }
        }
      })
  })
})
