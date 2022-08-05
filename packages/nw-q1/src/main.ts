import { App } from 'cdktf'
import { NWQ1Stack } from './components/stacks/nwQ1'

const app = new App()
new NWQ1Stack(app, 'nw-q1')
app.synth()
