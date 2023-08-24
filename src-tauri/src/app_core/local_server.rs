// Copyright 2019-2021 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use std::collections::HashMap;

use http::Uri;
use tauri::{
    plugin::{Builder as PluginBuilder, TauriPlugin},
    Runtime,
};
use tiny_http::{Header, Response as HttpResponse, Server, StatusCode};

pub struct Request {
    url: String,
}

impl Request {
    pub fn url(&self) -> &str {
        &self.url
    }
}

pub struct Response {
    headers: HashMap<String, String>,
}

impl Response {
    pub fn add_header<H: Into<String>, V: Into<String>>(&mut self, header: H, value: V) {
        self.headers.insert(header.into(), value.into());
    }
}
type OnRequest = Option<Box<dyn Fn(&Request, &mut Response) + Send + Sync>>;

pub struct Builder {
    port: u16,
    address: String,
    on_request: OnRequest,
    // ws_port is faculative
    ws_port: Option<u16>,
}

impl Builder {
    pub fn new(address: String, port: u16) -> Self {
        Self {
            port,
            address,
            on_request: None,
            ws_port: None,
        }
    }

    pub fn set_ws_port(&mut self, port: u16) {
        self.ws_port = Some(port);
    }

    pub fn on_request<F: Fn(&Request, &mut Response) + Send + Sync + 'static>(
        mut self,
        f: F,
    ) -> Self {
        self.on_request.replace(Box::new(f));
        self
    }

    fn tauri_command(&mut self, command: &str) -> HttpResponse<std::io::Cursor<Vec<u8>>> {
        let mut resp = HttpResponse::from_data("".as_bytes().to_vec());

        match command {
            "ws_port" => {
                if let Some(ws_port) = self.ws_port {
                    resp = HttpResponse::from_data(ws_port.to_string().into_bytes());
                    resp.add_header(Header::from_bytes("Content-Type", "text/plain").unwrap());
                }
            } 
            _ => {}
        }

        resp
    }

    pub fn build<R: Runtime>(mut self) -> TauriPlugin<R> {
        let port = self.port;
        let address = self.address;
        let on_request = self.on_request.take();

        PluginBuilder::new("localhost")
            .setup(move |app| {
                let asset_resolver = app.asset_resolver();
                std::thread::spawn(move || {
                    let server =
                        Server::http(&format!("{address}:{port}")).expect("Unable to spawn server");
                    // log url
                    println!("Serving at http://{}:{}", address, port);
                    for req in server.incoming_requests() {
						// if request is for ws server, ignore
						if req.url().starts_with("/ws") {
							continue;
						}

                        if req.url().starts_with("/___tauri") {
                            let command = &req.url()["/___tauri/".len()..];
                            let mut resp = HttpResponse::from_data("".as_bytes().to_vec());

                            // log
                            println!("Command: {}", command);

                            match command {
                                "ws_port" => {
                                    if let Some(ws_port) = self.ws_port {
                                        resp = HttpResponse::from_string(ws_port.to_string());
                                        resp.add_header(Header::from_bytes("Content-Type", "text/plain").unwrap());
                                    }
                                } 
                                _ => {
                                    // return error 404
                                    resp = HttpResponse::new(
                                        StatusCode(404),
                                        vec![],
                                        std::io::Cursor::new(vec![]),
                                        None,
                                        None,
                                    );
                                }
                            }

                            // check if origin is present
                            let origin = req.headers().iter().find(|h| h.field.as_str() == "Origin");

                            if let Some(origin) = origin {
                                // cors allow : localhost, 127.0.0.1 and address variable
                                let allowed_origins = [
                                    format!("http://localhost:{}", port),
                                    format!("http://127.0.0.1:{}", port),
                                    format!("http://{}:{}", address, port),
                                ];

                                if !allowed_origins.contains(&origin.value.to_string()) {
                                    // return error 403
                                    resp = HttpResponse::new(
                                        StatusCode(403),
                                        vec![],
                                        std::io::Cursor::new(vec![]),
                                        None,
                                        None,
                                    );
                                } else {
                                    resp.add_header(Header::from_bytes("Access-Control-Allow-Origin", origin.value.to_string()).unwrap());
                                }
                            }
                            
                            req.respond(resp).expect("unable to setup response");
                            continue;
                        }

						// log request
						println!("Request: {}", req.url());
                        let path = req
                            .url()
                            .parse::<Uri>()
                            .map(|uri| uri.path().into())
                            .unwrap_or_else(|_| req.url().into());

                        #[allow(unused_mut)]
                        if let Some(mut asset) = asset_resolver.get(path) {
                            let request = Request {
                                url: req.url().into(),
                            };
                            let mut response = Response {
                                headers: Default::default(),
                            };

                            response.add_header("Content-Type", asset.mime_type);
                            if let Some(mut csp) = asset.csp_header {
								csp = "default-src * 'unsafe-eval' 'unsafe-inline' 'self' img-src: 'self' style-src: 'self' 'unsafe-inline' event-src: 'self' 'unsafe-inline' script-src: 'self' 'unsafe-inline' 'unsafe-eval' font-src: 'self' 'unsafe-inline' data: 'self' 'unsafe-inline'".into();
                                response
                                    .headers
                                    .insert("Content-Security-Policy".into(), csp);
                            }

                            if let Some(on_request) = &on_request {
                                on_request(&request, &mut response);
                            }

                            #[cfg(target_os = "linux")]
                            if let Some(response_csp) =
                                response.headers.get("Content-Security-Policy")
                            {
                                let html = String::from_utf8_lossy(&asset.bytes);
                                let body =
                                    html.replacen(tauri::utils::html::CSP_TOKEN, response_csp, 1);
                                asset.bytes = body.as_bytes().to_vec();
                            }

                            let mut resp = HttpResponse::from_data(asset.bytes);
                            for (header, value) in response.headers {
                                if let Ok(h) = Header::from_bytes(header.as_bytes(), value) {
                                    resp.add_header(h);
                                }
                            }
                            req.respond(resp).expect("unable to setup response");
                        }
                    }
                });
                Ok(())
            })
            .build()
    }
}
