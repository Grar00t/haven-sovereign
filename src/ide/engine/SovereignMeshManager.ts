import Gun from 'gun';

/**
 * SOVEREIGN MESH MANAGER
 * Decentralized WebRTC signaling via GunDB gossip protocol.
 * Handshakes are stored in ephemeral Gun nodes.
 */
export class SovereignMeshManager {
    private gun: any;
    private myPeerId: string;
    private connections: Map<string, RTCPeerConnection> = new Map();

    constructor(peerId: string, gunInstance: any) {
        this.myPeerId = peerId;
        this.gun = gunInstance;
        this.listenForSignals();
    }

    /**
     * Listen for incoming WebRTC offers/ICE candidates on our Gun node.
     */
    private listenForSignals() {
        this.gun.get('haven').get('mesh').get('signals').get(this.myPeerId)
            .map()
            .on(async (data: any, senderId: string) => {
                if (!data || data.processed) return;

                let pc = this.connections.get(senderId);
                if (!pc) pc = this.createPeerConnection(senderId);

                if (data.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    this.sendSignal(senderId, { type: 'answer', sdp: answer });
                } else if (data.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                } else if (data.type === 'candidate') {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            });
    }

    private createPeerConnection(remoteId: string): RTCPeerConnection {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Replace with local STUN for true sovereignty
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal(remoteId, { type: 'candidate', candidate: event.candidate });
            }
        };

        this.connections.set(remoteId, pc);
        return pc;
    }

    private sendSignal(targetId: string, signal: any) {
        this.gun.get('haven').get('mesh').get('signals').get(targetId).get(this.myPeerId).put({
            ...signal,
            timestamp: Date.now(),
            processed: false
        });
    }

    /**
     * Initiates a connection to a remote peer to open a data channel.
     */
    async connectToPeer(remoteId: string): Promise<RTCDataChannel> {
        const pc = this.createPeerConnection(remoteId);
        const dc = pc.createDataChannel('git-transport');

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignal(remoteId, { type: 'offer', sdp: offer });

        return new Promise((resolve) => {
            dc.onopen = () => resolve(dc);
        });
    }

    /**
     * Bridge for isomorphic-git webrtcHttpClient
     */
    async requestBinary(remoteId: string, payload: Uint8Array): Promise<Uint8Array> {
        const dc = await this.connectToPeer(remoteId);
        return new Promise((resolve) => {
            dc.onmessage = (event) => {
                resolve(new Uint8Array(event.data));
                dc.close();
            };
            dc.send(payload);
        });
    }
}

// Exported as a singleton for the IDE environment
export const sovereignMesh = new SovereignMeshManager(
    `peer-${Math.random().toString(36).substr(2, 9)}`,
    Gun({ peers: ['https://gun-manhattan.herokuapp.com/gun'] })
);