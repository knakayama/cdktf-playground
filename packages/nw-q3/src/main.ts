import { App } from 'cdktf'
import { NWQ3Stack } from './components/stacks/nwQ3'

const app = new App()
new NWQ3Stack(app, 'nw-q3')
app.synth()
