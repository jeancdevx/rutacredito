// Import tests explicitly so the Node 24 test runner registers every case in the
// same process, including hosts that wrap the node executable with a shell shim.
import './data.test'
import './engine.test'
import './route.test'
