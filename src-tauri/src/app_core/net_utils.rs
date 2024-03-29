use std::net::{SocketAddr, TcpListener};

use tauri::Config;
use std::io::Write;

pub fn get_ip() -> String {
    let interfaces = get_if_addrs::get_if_addrs().unwrap();
    let mut ip = String::new();
    for interface in interfaces {
        if interface.is_loopback() { continue; }

        // if interface is ipv6, skip it (there is no method for it, so we check if it contains a colon)
        if interface.ip().to_string().contains(":") { continue; }

        ip = interface.ip().to_string();
        break;
    }

    // if we didn't find an ip, use 127.0.0.1 (localhost)
    if ip.is_empty() {
        ip = "127.0.0.1".to_string();
    }

    return ip
}

// check if the port is free on the computer, and allowed on the local network
pub fn is_port_free(port: u16) -> bool {
    let ip = get_ip();
    let socket = SocketAddr::new(ip.parse().unwrap(), port);
    let listener = TcpListener::bind(socket);
    match listener {
        Ok(_) => true,
        Err(_) => false,
    }
}

// get a free port on the computer and allowed on the local network
pub fn get_free_port() -> u16 {
    let mut port = 8080;
    while !is_port_free(port) {
        port += 1;
    }
    port
}

// register the port for the HTTP server in a file in the $APP_DATA_DIR
// this is used by the desktop app to know which port to use
pub fn register_port(config: &Config, port: u16) {
    let data_dir = tauri::api::path::app_data_dir(config).unwrap();

    // Check if the data dir exists, if not, create it
    if !data_dir.exists() {
        std::fs::create_dir_all(&data_dir).unwrap();
    }

    let port_file = data_dir.join("http_port");
    std::fs::write(port_file, port.to_string()).unwrap();
}

// get the port for the HTTP server from the file in the $DATA_DIR
// this is used by the desktop app to know which port to use
pub fn load_port(config: &Config) -> Option<u16> {
    let data_dir = tauri::api::path::app_data_dir(config).unwrap();
    let port_file = data_dir.join("http_port");
	if port_file.exists() {
		let port = std::fs::read_to_string(port_file).unwrap();
		Some(port.parse().unwrap())
	} else {
		None
	}
}
