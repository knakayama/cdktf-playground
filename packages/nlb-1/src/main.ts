import { App } from 'cdktf'
import { Nlb1Stack } from './components/stacks/nlb1'

const app = new App()
new Nlb1Stack(app, 'nlb-1')
app.synth()
