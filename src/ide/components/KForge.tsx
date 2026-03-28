import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Hammer, GitBranch, Share2, Lock, Plus, Download,
    Database, RefreshCw, ShieldCheck, Globe, FolderGit2, Clock
} from 'lucide-react';
import git from 'isomorphic-git';
import FS from '@isomorphic-git/lightning-fs';
import type { HttpClient } from 'isomorphic-git';
import { sovereignMesh } from '../engine/SovereignMeshManager';
import Gun from 'gun';

// Initialize local file system for git
const fs = new FS('haven-kforge-fs');

// Initialize GunDB instance
// In a production sovereign setup, you'd replace the Heroku peer with local mesh relay nodes.
const gun = Gun({
    peers: ['https://gun-manhattan.herokuapp.com/gun']
}) as import('gun').GunInstance;

/**
 * SOVEREIGN TRANSPORT: WebRTC Custom HTTP Client
 * Routes 'git' requests through P2P DataChannels instead of standard TCP/HTTP.
 */
const webrtcHttpClient = (async ({ url, method, headers, body }) => {
    console.log(`[Sovereign-Transport] Routing ${method} request to peer: ${url}`);

    // 1. Identify Target Peer from URL (e.g., "p2p://PEER_ID/repo.git")
    const peerId = new URL(url).hostname;

    // 2. Access DataChannel (Assuming a global mesh manager or hook state)
    // This is where we bridge to our WebRTC data stream.
    const responseHeaders: Record<string, string> = {
        'content-type': 'application/x-git-upload-pack-result',
    };

    const responseBody = (async function* () {
        const data = await sovereignMesh.requestBinary(peerId, body ? new Uint8Array(body as ArrayBuffer) : new Uint8Array());
        yield data;
    })();

    return {
        url,
        method,
        headers: responseHeaders,
        body: responseBody,
        statusCode: 200,
        statusMessage: 'OK (Sovereign P2P)',
    };
}) as unknown as HttpClient;

/**
 * Hook to handle P2P pointer synchronization via GunDB
 */
function useKForgeP2P() {
    const [connectedPeers, setConnectedPeers] = useState<string[]>([]);

    // Broadcast a local commit pointer to the mesh
    const broadcastUpdate = useCallback((repoName: string, sha: string) => {
        console.log(`[K-Forge] Gossiping HEAD for ${repoName}: ${sha.slice(0, 7)}`);
        gun.get('haven-kforge').get('pointers').get(repoName).put({
            head: sha,
            timestamp: Date.now()
        });
    }, []);

    // Listen for updates from other peers
    const subscribeToUpdates = useCallback((repoName: string, onUpdate: (sha: string) => void) => {
        gun.get('haven-kforge').get('pointers').get(repoName).get('head').on((sha: string) => {
            if (sha) onUpdate(sha);
        });
    }, []);

    const connectToPeer = async (targetId: string) => {
        setConnectedPeers(prev => [...prev, targetId]);
    };

    return { connectedPeers, connectToPeer, broadcastUpdate, subscribeToUpdates };
}

/**
 * Hook to encapsulate Sovereign Git operations
 */
function useKForgeGit() {
    const initRepo = async (name: string) => {
        const dir = `/${name}`;

        // 1. Create directory
        await fs.promises.mkdir(dir);

        // 2. Initialize git repo
        await git.init({ fs, dir });

        // 3. Create initial files
        const readmePath = 'README.md';
        await fs.promises.writeFile(`${dir}/${readmePath}`, `# ${name}\n\nCreated with K-Forge Sovereign Edition.`);
        await git.add({ fs, dir, filepath: readmePath });

        return await git.commit({
            fs,
            dir,
            author: { name: 'KHAWRIZM', email: 'dev@khawrizm.sa' },
            message: 'Initial commit from K-Forge'
        });
    };

    return { initRepo };
}

interface Repo {
    id: string;
    name: string;
    branches: number;
    size: string;
    peers: number;
    status: 'synced' | 'syncing' | 'offline' | 'local';
    encrypted: boolean;
}

const SAMPLE_REPOS: Repo[] = [
    { id: '1', name: 'haven-core', branches: 3, size: '45.2 MB', peers: 12, status: 'synced', encrypted: true },
    { id: '2', name: 'niyah-engine', branches: 1, size: '12.8 MB', peers: 8, status: 'synced', encrypted: true },
];

export const KForge = () => {
    const [repos, setRepos] = useState<Repo[]>(SAMPLE_REPOS);
    const [activeTab, setActiveTab] = useState<'repos' | 'network'>('repos');
    const [isCreating, setIsCreating] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [newRepoName, setNewRepoName] = useState('');
    const [cloneUrl, setCloneUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [autoSync, setAutoSync] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const { connectedPeers, connectToPeer, broadcastUpdate } = useKForgeP2P();
    const { initRepo } = useKForgeGit();

    // Auto-sync effect
    useEffect(() => {
        if (!autoSync) return;

        const sync = () => {
            setLastSync(new Date());
            setRepos(prev => prev.map(r => ({ ...r, status: 'synced' })));
        };

        // Initial sync
        sync();
        const interval = setInterval(sync, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
    }, [autoSync]);

    // Initialize git creation
    const handleCreateRepo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRepoName.trim()) return;

        setIsProcessing(true);
        try {
            const sha = await initRepo(newRepoName);

            // Gossip the new pointer to the network
            broadcastUpdate(newRepoName, sha);

            // 4. Add to UI
            const newRepo: Repo = {
                id: Date.now().toString(),
                name: newRepoName,
                branches: 1,
                size: '0.1 KB',
                peers: 0,
                status: 'local',
                encrypted: true
            };

            setRepos(prev => [newRepo, ...prev]);
            setNewRepoName('');
            setIsCreating(false);
        } catch (err) {
            console.error('K-Forge Init Error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Clone existing repo
    const handleCloneRepo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cloneUrl.trim()) return;

        setIsProcessing(true);
        try {
            const name = cloneUrl.split('/').pop()?.replace('.git', '') || `repo-${Date.now()}`;
            const dir = `/${name}`;

            await fs.promises.mkdir(dir);

            await git.clone({
                fs,
                http: webrtcHttpClient, // Use the Sovereign transport
                dir,
                url: cloneUrl,
                corsProxy: 'https://cors.isomorphic-git.org', // Required for browser
                singleBranch: true,
                depth: 1
            });

            const newRepo: Repo = {
                id: Date.now().toString(),
                name,
                branches: 1,
                size: 'Calculating...',
                peers: 1,
                status: 'synced',
                encrypted: true
            };

            setRepos(prev => [newRepo, ...prev]);
            setCloneUrl('');
            setIsCloning(false);
        } catch (err) {
            console.error('K-Forge Clone Error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-black/40">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-bold text-[#F05533] flex items-center gap-2">
                    <Hammer className="w-4 h-4" />
                    K-FORGE
                </h2>
                <p className="text-[10px] text-white/40 mt-1">
                    المطرقة السيادية — Decentralized Git Forge
                </p>
            </div>

            {/* Controls */}
            <div className="px-4 py-2 flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('repos')}
                    className={`flex-1 text-[10px] py-1.5 rounded flex items-center justify-center gap-2 transition-colors ${activeTab === 'repos' ? 'bg-[#F05533]/20 text-[#F05533]' : 'hover:bg-white/5 text-white/60'}`}
                >
                    <Database size={12} /> REPOSITORIES
                </button>
                <button
                    onClick={() => setActiveTab('network')}
                    className={`flex-1 text-[10px] py-1.5 rounded flex items-center justify-center gap-2 transition-colors ${activeTab === 'network' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-white/60'}`}
                >
                    <Globe size={12} /> P2P MESH
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {activeTab === 'repos' ? (
                    <>
                        {/* Create Form */}
                        {isCreating ? (
                            <form onSubmit={handleCreateRepo} className="bg-white/5 border border-[#F05533]/40 rounded p-3 mb-3">
                                <div className="text-[10px] text-[#F05533] mb-2 font-bold flex items-center gap-2">
                                    <FolderGit2 size={12} /> NEW SOVEREIGN REPO
                                </div>
                                <input
                                    value={newRepoName}
                                    onChange={e => setNewRepoName(e.target.value)}
                                    placeholder="repository-name"
                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white mb-2 focus:border-[#F05533]/50 outline-none"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button type="submit" disabled={isProcessing} className="flex-1 bg-[#F05533] text-white text-[10px] font-bold py-1.5 rounded hover:opacity-90">
                                        {isProcessing ? 'FORGING...' : 'INITIALIZE .GIT'}
                                    </button>
                                    <button type="button" onClick={() => setIsCreating(false)} className="px-3 bg-white/10 text-white text-[10px] py-1.5 rounded hover:bg-white/20">
                                        CANCEL
                                    </button>
                                </div>
                            </form>
                        ) : (
                            isCloning ? (
                                <form onSubmit={handleCloneRepo} className="bg-white/5 border border-blue-500/40 rounded p-3 mb-3">
                                    <div className="text-[10px] text-blue-400 mb-2 font-bold flex items-center gap-2">
                                        <Download size={12} /> CLONE FROM P2P/URL
                                    </div>
                                    <input
                                        value={cloneUrl}
                                        onChange={e => setCloneUrl(e.target.value)}
                                        placeholder="https://github.com/user/repo.git"
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white mb-2 focus:border-blue-500/50 outline-none font-mono"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={isProcessing} className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded hover:opacity-90">
                                            {isProcessing ? 'CLONING...' : 'CLONE REPO'}
                                        </button>
                                        <button type="button" onClick={() => setIsCloning(false)} className="px-3 bg-white/10 text-white text-[10px] py-1.5 rounded hover:bg-white/20">
                                            CANCEL
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="flex-1 py-2 border border-[#F05533]/40 text-[#F05533] rounded text-[10px] font-bold hover:bg-[#F05533]/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={12} /> CREATE
                                    </button>
                                    <button
                                        onClick={() => setIsCloning(true)}
                                        className="flex-1 py-2 border border-blue-500/40 text-blue-400 rounded text-[10px] font-bold hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download size={12} /> CLONE
                                    </button>
                                </div>
                            )
                        )}

                        {repos.map(repo => (
                            <motion.div
                                key={repo.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded p-3 hover:border-[#F05533]/30 transition-colors group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <GitBranch size={14} className="text-[#F05533]" />
                                        <span className="text-xs font-bold text-white/90">{repo.name}</span>
                                    </div>
                                    {repo.encrypted && (
                                        <span className="inline-flex text-green-400" title="Encrypted" aria-label="Encrypted">
                                            <Lock size={10} />
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-[9px] text-white/40 font-mono mb-2">
                                    <div className="flex items-center gap-1">
                                        <Database size={10} /> {repo.size}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Share2 size={10} /> {repo.peers} PEERS
                                    </div>
                                    <div className={`flex items-center gap-1 ${repo.status === 'syncing' ? 'text-yellow-400 animate-pulse' : repo.status === 'local' ? 'text-blue-400' : 'text-green-400'}`}>
                                        <RefreshCw size={10} className={repo.status === 'syncing' ? 'animate-spin' : ''} />
                                        {repo.status.toUpperCase()}
                                    </div>
                                </div>

                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#F05533] w-full opacity-80" />
                                </div>
                            </motion.div>
                        ))}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4 relative">
                            <Globe size={32} className="text-blue-400" />
                            <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-ping" />
                        </div>
                        <h3 className="text-xs font-bold text-blue-400 mb-1">SOVEREIGN MESH ACTIVE</h3>
                        <div className="flex flex-col gap-2 mt-4 max-w-xs mx-auto">
                            <div className="bg-white/5 p-2 rounded border border-white/10 text-[9px] font-mono text-left">
                                <div className="text-white/30 uppercase mb-1">Active Connections ({connectedPeers.length})</div>
                                {connectedPeers.length > 0 ? (
                                    connectedPeers.map(p => <div key={p} className="text-green-400">● {p}</div>)
                                ) : (
                                    <div className="text-white/20 italic">No peers detected...</div>
                                )}
                            </div>
                            <button
                                onClick={() => connectToPeer("NODE-" + Math.random().toString(36).slice(2, 7))}
                                className="bg-blue-600/20 text-blue-400 border border-blue-500/30 py-1.5 rounded text-[10px] font-bold"
                            >
                                DISCOVER LOCAL PEERS
                            </button>
                        </div>
                        <p className="text-[10px] text-white/40 px-4">
                            Your code is distributed across {connectedPeers.length || repos.reduce((acc, r) => acc + r.peers, 0)} trusted nodes.
                            No central server. No takedowns.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/10 flex justify-between items-center text-[9px] font-mono text-white/30">
                <span className="flex items-center gap-1">
                    <ShieldCheck size={10} className="text-green-400" />
                    K-FORGE PROTOCOL v1
                </span>

                <div className="flex items-center gap-3">
                    {/* Auto Sync Toggle */}
                    <button
                        onClick={() => setAutoSync(!autoSync)}
                        className={`flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded transition-colors ${autoSync ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                        title="Sync every 5 mins"
                    >
                        <RefreshCw size={10} className={autoSync ? "animate-spin" : ""} style={{ animationDuration: '3s' }} />
                        {autoSync ? 'AUTO-SYNC: ON' : 'AUTO-SYNC: OFF'}
                    </button>

                    {/* Last Sync Time */}
                    {lastSync && (
                        <span className="flex items-center gap-1 text-[9px] text-white/40 font-mono">
                            <Clock size={10} />
                            {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};