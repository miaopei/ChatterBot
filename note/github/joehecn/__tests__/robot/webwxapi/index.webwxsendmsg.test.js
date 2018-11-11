
jest.mock('superagent')
const superagent = require('superagent')
const webwxapi = require('../../../src/main/robot/webwxapi')
const mockAgent = require('../../../helper/mockAgent.js')

test('webwxsendmsg', async () => {
  expect.assertions(1)
    
  superagent.agent = mockAgent({
    text: `{"test": 0}`,
    hasSend: true
  })
  await webwxapi.jslogin()

  const res = await webwxapi.webwxsendmsg('', {})

  expect(res.test).toBe(0)
})
