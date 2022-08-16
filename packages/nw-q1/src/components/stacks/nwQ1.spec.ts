import { Testing } from 'cdktf'
import { NWQ1Stack } from './nwQ1'
import 'cdktf/lib/testing/adapters/jest'

describe('Unit testing using assertions', () => {
  test('should contain a container', () => {
    const app = Testing.app()
    const stack = new NWQ1Stack(app, 'test')

    expect(Testing.fullSynth(stack)).toBeValidTerraform()
  })
})
