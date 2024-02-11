// Define Pybricks UUID's
let pybricks_service_uuid = 'c5f50001-8280-46da-89f4-6d8051e4aeef';
let pybricks_event_uuid = 'c5f50002-8280-46da-89f4-6d8051e4aeef';
// Define UTF8 Encoder/Decoder
let b_encoder = new TextEncoder();
let b_decoder = new TextDecoder('utf-8');
// Define arrow keys and there corresponding commands on keypress
let movement_cmds_keydown = {
    'ArrowUp': b_encoder.encode('fwd'), // Forward
    'ArrowDown': b_encoder.encode('rev'), // Reverse
    'ArrowLeft': b_encoder.encode('lfe'), // Left
    'ArrowRight': b_encoder.encode('rig'), // Right
};
// Define arrow keys and there corresponding commands on key release
let movement_cmds_keyup = {
    'ArrowUp': b_encoder.encode('stp'), // Stop
    'ArrowDown': b_encoder.encode('stp'), // Stop
    'ArrowLeft': b_encoder.encode('mid'), // Center turning
    'ArrowRight': b_encoder.encode('mid'), // Center turning
};
// Define Bluetooth Characteristic
let bluetooth_char;
// Don't send commands until program is started
let ready = 0;
// No key has been pressed yet
let latest_cmd = "";
// Status element
let status_element = document.getElementById("status");
// Bluetooth element
let connect_bt = document.getElementById("connect_bt");
// Battery element
let bty_element = document.getElementById("bty");
// Define command queue
let cmd_queue = Promise.resolve();
// Define device and status
let device;
let connected = false;
// Define Battery status
let bty_stat;
// Connect settings button to window
document.getElementById('settings_btn').addEventListener('click', function() {
    var settingsModal = new bootstrap.Modal(document.getElementById('settings'));
    settingsModal.show();
})
// Handle mobile mode toggle
document.getElementById('mobile_mode').addEventListener('change', function() {
    if (this.checked) {
        console.log("Mobile mode on");
        localStorage.setItem('mobile_mode', true);
    } else {
        console.log("Mobile mode off");
        localStorage.setItem('mobile_mode', false);
    }
})
// Set mobile toggle state
document.getElementById('mobile_mode').checked = JSON.parse(localStorage.getItem('mobile_mode'));
document.getElementById('connect_bt').addEventListener('click', async () => {
try {
if (!connected) {
// Request Bluetooth devices with Pybricks service filter
device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [pybricks_service_uuid] }],
    });
// Connect to device with GATT
let gatt_srv = await device.gatt.connect();
// Create service handle
let service_handle = await gatt_srv.getPrimaryService(pybricks_service_uuid);
// Get Bluetooth characteristic
bluetooth_char = await service_handle.getCharacteristic(pybricks_event_uuid);
// Handle Bluetooth RX
bluetooth_char.addEventListener('characteristicvaluechanged', (event) => handle_rx(event))
await bluetooth_char.startNotifications();
status_element.innerHTML = "<span style='color: blue;'>Start the program on the Hub</span>";
// Handle keypresses
document.addEventListener('keydown', handleKeyPress);
document.addEventListener('keyup', handleKeyPress);
// We are now connected!
connected = true;
} else {
    // Define temporary variable
    let temp_message = b_encoder.encode('bye');
    // Add 6 to command (6 is the Pybricks code for write to stdin)
    let message = new Uint8Array([6, ...temp_message]);
    await send_cmd_pybricks(message)
    await device.gatt.disconnect()
    connect_bt.style.backgroundColor = '';
    connect_bt.innerHTML = 'Connect';
    status_element.innerHTML = "<span style='color: red;'>Disconnected</span>";
    // We are not connected now
    connected = false;
    // The hub is also not ready now
    ready = false;
}
} catch (error) {
    console.error("Error connecting to Pybricks Hub:", error);
}
// Create RX Handling function
function handle_rx(event) {
    let decoded_string = b_decoder.decode(event.target.value.buffer);
    if (ready != 1) {
        if (decoded_string.includes('rdy')) {
            ready = 1
            console.log('Hub Ready')
            status_element.innerHTML = "<span style='color: green;'>Hub Ready!</span>";
            // Change it to a disconnect button
            connect_bt.style.backgroundColor = 'red';
            connect_bt.innerHTML = 'Disconnect';
    }
    }
    if (decoded_string.includes('bty')) {
        // Extract battery value
        bty_stat = decoded_string.match(/\d+/)[0]
        // Update current battery value and determine color based on value
        bty_element.innerHTML = `Battery Percentage: <span style='color: ${bty_stat >= 50 ? 'green' : bty_stat >= 15 ? 'yellow' : 'red'};'>${bty_stat}</span>`;


    }
}
async function send_cmd_pybricks(message) {
    // Wrap the command in a function to be called later in the promise chain
    const sendCommand = async () => {
        await bluetooth_char.writeValue(message);
    };
    // Add command to promise chain
    cmd_queue = cmd_queue.then(sendCommand).catch(error => {
        console.error(`Error sending command: ${message}`, error);
    });
    // Return promise
    return cmd_queue;
}
function handleKeyPress(event) {
    let key = event.key;
    if (ready) {
        // If key is not being held
        if (latest_cmd != key) {
            // If it is a keypress and it is a recognized key
            if (event.type === 'keydown' && movement_cmds_keydown[key]) {
                latest_cmd = key
                // Define temporary variable
                let temp_message = movement_cmds_keydown[key];
                // Add 6 to command (6 is the Pybricks code for write to stdin)
                let message = new Uint8Array([6, ...temp_message]);
                // Call Pybricks command sender
                send_cmd_pybricks(message);
            }
        }
    }
    // if it is a key being released
    if (event.type === 'keyup' && movement_cmds_keyup[key]) {
        latest_cmd = ""
        let temp_message = movement_cmds_keyup[key];
        // Add 6 to command (6 is the Pybricks code for write to stdin)
        let message = new Uint8Array([6, ...temp_message]);
        send_cmd_pybricks(message);
    }
}

});