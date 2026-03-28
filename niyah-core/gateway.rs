use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use rand::Rng;

// ── P2P Node Definition ──────────────────────────────────────
#[derive(Clone, Debug)]
pub struct P2PNode {
    pub id: String,
    pub status: String, // "ACTIVE", "RELAY", "OFFLINE"
    pub latency_ms: u64,
}

// ── Gratech Gateway Engine ───────────────────────────────────
pub struct GratechGateway {
    nodes: Arc<Mutex<HashMap<String, P2PNode>>>,
    packet_queue: Arc<Mutex<VecDeque<(String, Vec<u8>)>>>, // (Target, Payload)
}

impl GratechGateway {
    pub fn new() -> Self {
        let mut nodes = HashMap::new();
        
        // Initialize mock mesh network
        nodes.insert("RUH-01".to_string(), P2PNode { id: "RUH-01".into(), status: "ACTIVE".into(), latency_ms: 12 });
        nodes.insert("JED-02".to_string(), P2PNode { id: "JED-02".into(), status: "RELAY".into(), latency_ms: 24 });
        nodes.insert("DMM-03".to_string(), P2PNode { id: "DMM-03".into(), status: "ACTIVE".into(), latency_ms: 18 });
        nodes.insert("AHMED".to_string(), P2PNode { id: "AHMED".into(), status: "ACTIVE".into(), latency_ms: 45 });

        GratechGateway {
            nodes: Arc::new(Mutex::new(nodes)),
            packet_queue: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    /// Route an encrypted payload through the mesh
    pub fn route_payload(&self, target_id: &str, payload: Vec<u8>) -> Result<String, String> {
        let nodes = self.nodes.lock().unwrap();
        
        if let Some(node) = nodes.get(target_id) {
            println!(
                "🌐 [GRATECH GATEWAY] Routing {} bytes to node {}",
                payload.len(),
                mask_id(&node.id)
            );
            println!("   ↳ Path: LOCAL -> MESH -> {} (Latency: {}ms)", node.status, node.latency_ms);

            // Simulate network jitter
            let jitter = rand::thread_rng().gen_range(0..15);
            let total_latency = node.latency_ms + jitter;

            // Queue packet (in a real system, this would push to a network socket)
            self.packet_queue.lock().unwrap().push_back((target_id.to_string(), payload));
            
            Ok(format!("DISPATCHED_OK::LATENCY_{}ms", total_latency))
        } else {
            println!("❌ [GRATECH GATEWAY] Node {} not found in swarm.", target_id);
            Err("NODE_UNREACHABLE".to_string())
        }
    }

    pub fn get_network_status(&self) -> String {
        let nodes = self.nodes.lock().unwrap();
        let active = nodes.values().filter(|n| n.status == "ACTIVE").count();
        format!("MESH_ONLINE::NODES_{}::ACTIVE_{}", nodes.len(), active)
    }
}

/// Helper to mask IDs for logs
pub fn mask_id(id: &str) -> String {
    if id.len() > 8 {
        format!("{}...{}", &id[0..4], &id[id.len()-4..])
    } else {
        id.to_string()
    }
}
