use clap::{Args, Parser, Subcommand};
use serde::Serialize;

mod forensics;
mod gateway;

use forensics::ProcessGuard;
use gateway::GratechGateway;

#[derive(Parser, Debug)]
#[command(
    name = "niyah",
    version,
    about = "Local-first NIYAH core CLI for health, routing, and sovereign diagnostics."
)]
struct Cli {
    #[arg(long, global = true, help = "Render command output as JSON.")]
    json: bool,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Run a basic local system scan for suspicious processes.
    Doctor,
    /// Inspect or exercise the local gateway prototype.
    Gateway(GatewayArgs),
}

#[derive(Args, Debug)]
struct GatewayArgs {
    #[command(subcommand)]
    command: GatewayCommands,
}

#[derive(Subcommand, Debug)]
enum GatewayCommands {
    /// Show current mock mesh status.
    Status,
    /// Route a test payload through the gateway prototype.
    Route {
        #[arg(long)]
        target: String,
        #[arg(long)]
        payload: String,
    },
}

#[derive(Serialize)]
struct DoctorOutput {
    scanned_processes: usize,
    threat_count: usize,
    clean: bool,
    findings: Vec<forensics::ThreatFinding>,
}

#[derive(Serialize)]
struct GatewayStatusOutput {
    status: String,
}

#[derive(Serialize)]
struct GatewayRouteOutput {
    target: String,
    bytes: usize,
    result: String,
}

fn main() {
    let cli = Cli::parse();

    let result = match cli.command {
        Commands::Doctor => run_doctor(cli.json),
        Commands::Gateway(args) => run_gateway(args, cli.json),
    };

    if let Err(error) = result {
        eprintln!("niyah: {error}");
        std::process::exit(1);
    }
}

fn run_doctor(as_json: bool) -> Result<(), String> {
    let report = ProcessGuard::new().scan_report()?;
    let output = DoctorOutput {
        scanned_processes: report.scanned_processes,
        threat_count: report.threat_count(),
        clean: report.is_clean(),
        findings: report.findings,
    };

    if as_json {
        println!(
            "{}",
            serde_json::to_string_pretty(&output).map_err(|e| e.to_string())?
        );
        return Ok(());
    }

    println!("NIYAH doctor");
    println!("Scanned processes: {}", output.scanned_processes);
    println!("Threat findings: {}", output.threat_count);

    if output.clean {
        println!("Status: clean");
        return Ok(());
    }

    println!("Status: suspicious");
    for finding in output.findings {
        println!(
            "- [{}] {} matched '{}'",
            finding.category.label(),
            finding.process_name,
            finding.indicator
        );
    }

    Ok(())
}

fn run_gateway(args: GatewayArgs, as_json: bool) -> Result<(), String> {
    let gateway = GratechGateway::new();

    match args.command {
        GatewayCommands::Status => {
            let output = GatewayStatusOutput {
                status: gateway.get_network_status(),
            };

            if as_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&output).map_err(|e| e.to_string())?
                );
            } else {
                println!("NIYAH gateway status");
                println!("{}", output.status);
            }

            Ok(())
        }
        GatewayCommands::Route { target, payload } => {
            let bytes = payload.as_bytes().len();
            let result = gateway.route_payload(&target, payload.into_bytes())?;
            let output = GatewayRouteOutput {
                target,
                bytes,
                result,
            };

            if as_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&output).map_err(|e| e.to_string())?
                );
            } else {
                println!("NIYAH gateway route");
                println!("Target: {}", output.target);
                println!("Bytes: {}", output.bytes);
                println!("Result: {}", output.result);
            }

            Ok(())
        }
    }
}
