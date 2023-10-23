// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;
use tauri::{utils::config::AppUrl, WindowUrl};

use tokio::runtime::Runtime;

mod app_core;
use app_core::{ws_server::WsServer, net_utils::{get_ip, get_free_port, is_port_free, register_port, load_port}, local_server};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
   std::panic::set_hook(Box::new(|info| {
        // error!("Panicked: {:?}", info);

        // log info to file
        let mut log_file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open("error.log")
            .unwrap();

        let _ = writeln!(log_file, "Panicked: {:?}", info);

        // log info to console
        println!("Panicked: {:?}", info);
    }));

  let domain = if cfg!(dev) { "localhost".to_string() } else { get_ip() };

  // get a port for the WS server
  let ws_port = get_free_port();

  // use tokio to spawn the server
  let rt = Runtime::new().unwrap();
  
  // clone the domain and port for the WS server
  let ws_domain = domain.clone();
  let ws_port_clone = ws_port.clone();
  rt.block_on(async move {
    //log thread
    println!("Starting ws server");
    tokio::spawn(async move { WsServer::launch(ws_domain, ws_port_clone).await });
  });

  // check if the websocket server is running by checking on the port
  // then proceed to start the HTTP server
  if !cfg!(dev) {
    println!("Waiting for ws server to start");
    while is_port_free(ws_port) {
      std::thread::sleep(std::time::Duration::from_millis(100));
    }
  }

  let mut context = tauri::generate_context!();

  let http_port = if cfg!(dev) { 1420 } else {
    let old_p = load_port(context.config());
    if old_p.is_some() && is_port_free(old_p.unwrap()) {
      old_p.unwrap()
    } else {
      let p = get_free_port();
      register_port(context.config(), p);
      p
    }
  };
  // let domain = local_server::get_ip();

  let url = format!("http://{}:{}", domain, http_port).parse().unwrap();
  // log
  // println!("Serving at {}", url);

  let window_url = WindowUrl::External(url);
  // rewrite the config so the IPC is enabled on this URL
  context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());

  let mut local_server = local_server::Builder::new(domain, http_port);
  local_server.set_ws_port(ws_port);

  tauri::Builder::default()
    .plugin(local_server.build())
    .invoke_handler(tauri::generate_handler![greet])
    .run(context)
    .expect("error while running tauri application");
}