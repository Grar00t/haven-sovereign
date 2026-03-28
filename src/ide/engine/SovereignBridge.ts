import { exec, spawn, ChildProcess } from 'child_process';

/**
 * SovereignBridge — The Secure Link between HAVEN UI and Niyah Engine.
 * Built by KHAWRIZM (Sulaiman Alshammari)
 */
export class SovereignBridge {
    private static readonly MODEL = 'deepseek-r1:7b';
    private static activeTerminal: ChildProcess | null = null;

    /**
     * Executes intent analysis with zero-injection safety.
     * Replaces the insecure niyah_gateway.js logic.
     */
    public static async processIntent(input: string): Promise<string> {
        return new Promise((resolve, reject) => {
            console.log(`[SovereignBridge] Analyzing Intent: ${input.slice(0, 30)}...`);

            // Use spawn instead of exec to prevent Command Injection
            // This is the "Sovereign Shield" for your AI input
            const ollama = spawn('ollama', ['run', this.MODEL, input]);

            let output = '';
            let errorOutput = '';

            ollama.stdout.on('data', (data) => {
                output += data.toString();
            });

            ollama.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            ollama.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(new Error(`Ollama process failed: ${errorOutput}`));
                }
            });
        });
    }

    /**
     * Boots the Sovereign VM on Disk D using QEMU.
     * Targeted at the qemu-w64-setup found in Downloads.
     */
    public static startSovereignVM() {
        const qemuPath = 'C:\\Program Files\\qemu\\qemu-system-x86_64.exe';
        const diskPath = 'D:\\SOVEREIGN_LAB\\disks\\primary.qcow2';

        console.log(`[SovereignBridge] Initiating VM Boot from D:\\...`);

        // Command to launch VM with 8GB RAM and host CPU passthrough
        const args = [
            '-m', '8G',
            '-drive', `file=${diskPath},format=qcow2`,
            '-cpu', 'host',
            '-net', 'nic', '-net', 'user',
            '-display', 'gtk'
        ];

        const vm = spawn(qemuPath, args, { detached: true, stdio: 'ignore' });
        vm.unref();

        return "SOVEREIGN_NODE_01_BOOTING";
    }

    /**
     * Hybrid Terminal Logic: Switches between standard Python dev and Metasploit console.
     * This is the functional core of the "Dark Investigation Room".
     */
    public static switchTerminalMode(mode: 'PYTHON' | 'MSF'): string {
        console.log(`[NIYAH] Mode Switch Detected -> ${mode}. ARMING HYBRID ENVIRONMENT.`);

        if (this.activeTerminal) {
            this.activeTerminal.kill();
        }

        if (mode === 'MSF') {
            // Initialize Metasploit with custom prompt and quiet mode for forensic integration
            this.activeTerminal = spawn('msfconsole', ['-q', '-x', 'set PROMPT niyah-msf6; set QUIET true']);
            return "DARK_ROOM_MSF_LINKED";
        } else {
            // Standard Python interactive shell for development
            this.activeTerminal = spawn('python3', ['-q']);
            return "PYTHON_DEV_ENVIRONMENT_ACTIVE";
        }
    }
}
