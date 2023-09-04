use futures::{SinkExt, StreamExt, TryFutureExt};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::{self, UnboundedSender};
use tokio_stream::wrappers::UnboundedReceiverStream;
use warp::ws::{Message, WebSocket};
use warp::Filter;

pub struct WsServer { }

impl WsServer {
    pub async fn launch(addr: String, port: u16) {
        let mut addr = addr;

        // match addr localhost
        match addr.as_str() {
            "localhost" => addr = "127.0.0.1".to_string(),
            _ => {}
        }

        // Maintain a list of connected clients using a HashSet
        let clients = Arc::new(Mutex::new(HashMap::new()));

        // Maintain a shared state between all clients
        let shared_state = Arc::new(Mutex::new("{}".to_string()));

        // Create a broadcast channel to send messages to all connected clients
        // let (tx, _) = broadcast::channel(16);

        // WebSocket route filter
        let ws_route = warp::path("ws")
            .and(warp::ws())
            .map(move |ws: warp::ws::Ws| {
                // log
                println!("New client connected!");

                let clients = clients.clone();
                let shared_state = shared_state.clone();

                ws.on_upgrade(move |websocket| {
                    Self::handle_client(websocket, clients, shared_state)
                })
            });

        println!("WebSocket server starting");
        // Start the WebSocket server using warp

        let warp_addr: SocketAddr = format!("{}:{}", addr, port).parse().unwrap();
        println!("WebSocket server listening on {}", warp_addr);

        warp::serve(ws_route).run(warp_addr).await;
    }

    async fn handle_client(
        websocket: WebSocket,
        clients: Arc<Mutex<HashMap<String, UnboundedSender<Message>>>>,
        shared_state: Arc<Mutex<String>>,
    ) {
        // log
        println!("New client handled!");
        let (mut client_ws_tx, mut client_ws_rx) = websocket.split();

        // Use an unbounded channel to handle buffering and flushing of messages
        // to the websocket...
        let (tx, rx) = mpsc::unbounded_channel();
        let tx_clone = tx.clone();
        let mut rx = UnboundedReceiverStream::new(rx);

        tokio::task::spawn(async move {
            while let Some(message) = rx.next().await {
                client_ws_tx
                    .send(message)
                    .unwrap_or_else(|e| {
                        eprintln!("websocket send error: {}", e);
                    })
                    .await;
            }
        });

        // Generate a unique id for this unbouded sender
        let sender_id: String = uuid::Uuid::new_v4().to_string();
        let sender_id2 = sender_id.clone();

        // Add client's sender to the list of clients
        clients.lock().unwrap().insert(sender_id, tx);

        // Clone references for sending messages
        // let tx_broadcast = tx_broadcast.clone();-
        while let Some(result) = client_ws_rx.next().await {
            let msg = match result {
                Ok(msg) => msg,
                Err(_) => break,
            };

            let msg_str: String = msg.to_str().unwrap().to_string();

            // println!("Received message from client: {}", msg_str);

            // try to parse JSON message
            let json_msg: serde_json::Result<serde_json::Value> = serde_json::from_str(&msg_str);
            if json_msg.is_ok() {
                // check if type is "state_update"
                let json_msg = json_msg.unwrap();
                match json_msg.get("type") {
                    Some(type_val) => {
						let type_str: &str = type_val.as_str().unwrap();

                        match type_str {
                            "state_update" => {
                                // update shared state
                                let mut shared_state = shared_state.lock().unwrap();
                                *shared_state = json_msg.get("state").unwrap().to_string();

                                // log
                                // let time = chrono::Local::now();
                                // println!("[{}] Shared state updated", time.format("%H:%M:%S"));
                                // println!("Shared state updated: {}", shared_state);
                            }
                            "get_state" => {
                                // the client is requesting the current state
								let shared_state = shared_state.lock().unwrap();
								let state_update_msg = format!("{{\"type\": \"state_update\", \"state\": {}}}", shared_state);
                                //log message
                                println!("Sending state to client {}: {}", sender_id2, state_update_msg);
								if let Err(e) = tx_clone.send(Message::text(state_update_msg)) {
									println!("Error sending state to client {}: {}", sender_id2, e);
								}
                            }
                            "event" => {
                                // the client is sending an event
                                // no need to do anything here
                            }
                            _ => {
                                println!("Unknown message type");
                            }
                        }
                    }
                    None => {
                        println!("No type specified in message");
                    }
                }
            }

            // send this message to all clients (except sender)
            let mut clients = clients.lock().unwrap();
            for (id, tx) in clients.iter_mut() {
                if *id != sender_id2 {
                    // get client sink

                    if let Err(e) = tx.send(Message::text(msg_str.clone())) {
                        println!("Error sending message to client {}: {}", id, e);
                    }
                }
            }
        }

        // Remove client's sender from the list of clients
        clients.lock().unwrap().remove_entry(&sender_id2);
    }
}
