use std::fs;

pub struct ProcessGuard {
    blacklist: Vec<String>,
}

impl ProcessGuard {
    pub fn new() -> Self {
        Self {
            blacklist: vec![
                "telemetry".to_string(),
                "microsoft".to_string(),
                "google".to_string(),
                "analytics".to_string(),
            ],
        }
    }

    pub fn scan_and_purge(&self) -> Result<usize, String> {
        let mut threats_found = 0;
        let proc_dir = fs::read_dir("/proc").map_err(|e| e.to_string())?;

        for entry in proc_dir {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            
            if path.is_dir() {
                if let Some(file_name) = path.file_name() {
                    if file_name.to_string_lossy().chars().all(|c| c.is_digit(10)) {
                        let comm_path = path.join("comm");
                        if let Ok(comm) = fs::read_to_string(comm_path) {
                            let process_name = comm.trim();
                            if self.blacklist.iter().any(|b| process_name.contains(b)) {
                                println!("💀 [NIYAH FORENSICS] NON-SOVEREIGN PROCESS DETECTED: {}", process_name);
                                threats_found += 1;
                            }
                        }
                    }
                }
            }
        }
        Ok(threats_found)
    }
}
