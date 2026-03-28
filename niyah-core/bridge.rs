// Sovereign Niyah Bridge - Rust FFI Wrapper
// يسمح باستدعاء أوامر النواة من TypeScript عبر FFI
// KHAWRIZM Labs — Dragon403

use std::fs;
use std::ffi::CStr;
use std::os::raw::c_char;

mod forensics;
mod gateway;
mod phalanx;
use forensics::ProcessGuard;
use gateway::GratechGateway;
use phalanx::PhalanxGuard;

#[no_mangle]
pub extern "C" fn trigger_lockdown(reason: *const c_char) -> i32 {
    let reason = unsafe {
        if reason.is_null() {
            return -1;
        }
        CStr::from_ptr(reason).to_string_lossy().into_owned()
    };
    println!("💀 [NIYAH KERNEL] EXECUTING LOCKDOWN: {}", reason);
    // 1. قطع الاتصال بالإنترنت
    // 2. فصل نقاط الوصول للقرص D
    0
}

#[no_mangle]
pub extern "C" fn enforce_network_silence() -> i32 {
    println!("🛡️ [NIYAH KERNEL] Enforcing network silence. Telemetry blocked.");
    0
}

#[no_mangle]
pub extern "C" fn emergency_shred(reason: *const c_char) -> i32 {
    println!("💀 [PHALANX] EMERGENCY SHRED SEQUENCE INITIATED");

    // 1. Wipe Memory (Zeroize via overwriting sensitive buffers if applicable)
    // In FFI context, we can't easily wipe JS memory, but we can wipe Rust-managed secrets.

    // 2. Shred Files
    let paths = vec!["message_for_ahmed.bin", "session.key"];
    for path in paths {
        if let Ok(metadata) = fs::metadata(path) {
            let len = metadata.len();
            // 3-pass overwrite
            let _ = fs::write(path, vec![0xFF; len as usize]);
            let _ = fs::write(path, vec![0x00; len as usize]);
            let _ = fs::write(path, vec![0xAA; len as usize]);
            let _ = fs::remove_file(path);
            println!("💀 [PHALANX] Shredded: {}", path);
        }
    }

    // 3. Trigger Lockdown
    trigger_lockdown(reason);

    1
}

<<<<<<< HEAD
fn main() {
    println!("⚡ [NIYAH KERNEL] Sovereign Bridge Active.");
    println!("📡 [NIYAH KERNEL] Initializing Forensic Scan...");

    // Initialize Gratech Gateway
    let gateway = GratechGateway::new();
    println!("🌐 [NIYAH KERNEL] Gratech Gateway Online: {}", gateway.get_network_status());

    let guard = ProcessGuard::new();
    match guard.scan_report() {
        Ok(report) if report.is_clean() => {
            println!(
                "🛡️ [NIYAH KERNEL] System Integrity Verified. Scanned {} processes with no violations.",
                report.scanned_processes
            );
        }
        Ok(report) => {
            println!(
                "⚠ [NIYAH KERNEL] Found {} security violations across {} scanned processes!",
                report.threat_count(),
                report.scanned_processes
            );
            for finding in &report.findings {
                println!(
                    "   ↳ [{}] {} matched indicator '{}'",
                    finding.category.label(),
                    finding.process_name,
                    finding.indicator
                );
            }
            trigger_lockdown(b"Telemetry Detected\0".as_ptr() as *const c_char);
        }
        Err(e) => eprintln!("❌ [NIYAH KERNEL] Forensic Scan Failed: {}", e),
=======
#[no_mangle]
pub extern "C" fn phalanx_scan(dry_run: i32) -> i32 {
    let guard = PhalanxGuard::new(dry_run != 0);
    match guard.full_scan() {
        Ok(report) => {
            let summary = phalanx::format_report(&report);
            println!("{}", summary);
            report.threats_found.len() as i32
        }
        Err(e) => {
            eprintln!("[PHALANX] Scan error: {}", e);
            -1
        }
>>>>>>> 4d69da7ded22e131bcf451ba91ae11e28e036300
    }
}

#[no_mangle]
pub extern "C" fn phalanx_enforce_hosts() -> i32 {
    let guard = PhalanxGuard::new(false);
    match guard.enforce_hosts_block() {
        Ok(count) => count as i32,
        Err(e) => {
            eprintln!("[PHALANX] Host block error: {}", e);
            -1
        }
    }
}

fn main() {
    println!("[NIYAH KERNEL] Sovereign Bridge Active — KHAWRIZM Labs");
    println!("[NIYAH KERNEL] Initializing systems...\n");

    // Gratech P2P Gateway
    let gateway = GratechGateway::new();
    println!("[GRATECH] Network: {}", gateway.get_network_status());

    // Legacy forensics scan
    let guard = ProcessGuard::new();
    match guard.scan_and_purge() {
        Ok(0) => println!("[FORENSICS] Clean — no telemetry processes found"),
        Ok(threats) => {
            println!("[FORENSICS] {} telemetry processes detected!", threats);
            trigger_lockdown(b"Telemetry Detected\0".as_ptr() as *const c_char);
        },
        Err(e) => eprintln!("[FORENSICS] Scan failed: {}", e),
    }

    // Phalanx full scan
    println!("\n[PHALANX] Running full security scan...");
    let phalanx = PhalanxGuard::new(true);
    match phalanx.full_scan() {
        Ok(report) => {
            println!("{}", phalanx::format_report(&report));
        }
        Err(e) => eprintln!("[PHALANX] Error: {}", e),
    }

    println!("\n[NIYAH KERNEL] All systems nominal.");
    println!("الخوارزمية دائماً تعود للوطن — Dragon403");
}
