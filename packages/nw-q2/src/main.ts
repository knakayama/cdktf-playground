import { App } from 'cdktf'
import { NWQ2Stack } from './components/stacks/nwQ2'

const app = new App()
new NWQ2Stack(app, 'nw-q2')
app.synth()
